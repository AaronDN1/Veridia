from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.generated_output import GeneratedOutput, OutputType
from app.schemas.workspace import GraphRequest, GraphResponse
from app.services.graphing import generate_graph
from app.services.usage import ensure_usage_available, record_usage


router = APIRouter()


@router.post("/generate", response_model=GraphResponse)
def generate_graph_route(payload: GraphRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_usage_available(db, user)
    image_url = generate_graph(db, user, payload)
    usage_remaining = record_usage(db, user, "graphing")
    return {
        "image_url": image_url,
        "download_url": image_url,
        "usage_remaining": usage_remaining,
    }


@router.get("/outputs/{output_id}/file/{file_name}")
def get_graph_file(
    output_id: UUID,
    file_name: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    output = (
        db.query(GeneratedOutput)
        .filter(
            GeneratedOutput.id == output_id,
            GeneratedOutput.user_id == user.id,
            GeneratedOutput.output_type == OutputType.GRAPH,
        )
        .first()
    )
    if not output:
        raise HTTPException(status_code=404, detail="Graph not found.")

    path = (settings.graphs_dir / file_name).resolve()
    graphs_root = settings.graphs_dir.resolve()
    if graphs_root not in path.parents or not path.exists():
        raise HTTPException(status_code=404, detail="Graph not found.")

    expected_url = f"{settings.api_url}/api/graphing/outputs/{output.id}/file/{file_name}"
    if output.asset_url != expected_url:
        raise HTTPException(status_code=404, detail="Graph not found.")

    return FileResponse(path, filename=path.name, media_type="image/png")
