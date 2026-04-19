import math
import re
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.generated_output import GeneratedOutput, OutputType
from app.models.user import User
from app.schemas.workspace import GraphRequest


matplotlib.use("Agg")

SAFE_EQUATION_PATTERN = re.compile(r"^[0-9xX\+\-\*\/\^\(\)\.\s,sincotaepqrlgmn]*$")
GRAPH_RETENTION_DAYS = 14
SAFE_NAMESPACE = {
    "x": None,
    "sin": np.sin,
    "cos": np.cos,
    "tan": np.tan,
    "sqrt": np.sqrt,
    "log": np.log,
    "exp": np.exp,
    "pi": math.pi,
    "e": math.e,
}


def get_graph_retention_cutoff() -> datetime:
    return datetime.utcnow() - timedelta(days=GRAPH_RETENTION_DAYS)


def cleanup_expired_graphs(db: Session, user: User | None = None) -> int:
    cutoff = get_graph_retention_cutoff()
    query = db.query(GeneratedOutput).filter(
        GeneratedOutput.output_type == OutputType.GRAPH,
        GeneratedOutput.created_at < cutoff,
    )
    if user:
        query = query.filter(GeneratedOutput.user_id == user.id)

    expired_graphs = query.all()
    if not expired_graphs:
        return 0

    deleted_count = len(expired_graphs)
    for graph in expired_graphs:
        if graph.asset_url:
            file_name = graph.asset_url.rsplit("/", 1)[-1]
            graph_path = Path(settings.graphs_dir) / file_name
            if graph_path.exists():
                graph_path.unlink()
        db.delete(graph)
    db.commit()
    return deleted_count


def _evaluate_equation(equation: str, x_values: np.ndarray) -> np.ndarray:
    normalized = equation.replace("^", "**").replace("X", "x")
    if not SAFE_EQUATION_PATTERN.match(normalized.replace("**", "")):
        raise ValueError("Equation contains unsupported characters.")
    local_namespace = dict(SAFE_NAMESPACE)
    local_namespace["x"] = x_values
    return eval(normalized, {"__builtins__": {}}, local_namespace)


def generate_graph(db: Session, user: User, request: GraphRequest) -> str:
    cleanup_expired_graphs(db, user)
    fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
    ax.set_title(request.title)
    ax.set_xlabel(request.x_label)
    ax.set_ylabel(request.y_label)
    ax.grid(True, alpha=0.18)

    if request.equation:
        x_values = np.linspace(request.x_min, request.x_max, request.sample_count)
        y_values = _evaluate_equation(request.equation, x_values)
        ax.plot(x_values, y_values, linewidth=2.4, color="#2563eb", label=request.equation)

    for series in request.series:
        if request.graph_type == "scatter":
            ax.scatter(series.x, series.y, label=series.label or "Series", s=42, color="#0f766e")
        else:
            ax.plot(series.x, series.y, label=series.label or "Series", linewidth=2.2)

    if request.equation or request.series:
        ax.legend(frameon=False)

    file_name = f"{uuid.uuid4()}.png"
    output_path = Path(settings.graphs_dir) / file_name
    fig.savefig(output_path, bbox_inches="tight", facecolor="#ffffff")
    plt.close(fig)

    output = GeneratedOutput(
        user_id=user.id,
        output_type=OutputType.GRAPH,
        title=request.title,
        content=f"Generated graph for {request.title}",
    )
    db.add(output)
    db.flush()
    image_url = f"{settings.api_url}/api/graphing/outputs/{output.id}/file/{file_name}"
    output.asset_url = image_url
    db.commit()
    return image_url
