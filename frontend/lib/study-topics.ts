export type StudyTopic = {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  problem: string;
  metaDescription: string;
  content: string;
};

export type StudyCategory = {
  name: string;
  slug: string;
  description: string;
};

export const studyCategories: StudyCategory[] = [
  { name: "Calculus", slug: "calculus", description: "Limits, derivatives, integrals, and core ideas from single-variable calculus." },
  { name: "Algebra", slug: "algebra", description: "Equations, expressions, factoring, and symbolic problem solving." },
  { name: "Geometry", slug: "geometry", description: "Shapes, angles, area, volume, similarity, and coordinate geometry." },
  { name: "Trigonometry", slug: "trigonometry", description: "Angles, triangles, trig functions, identities, and the unit circle." },
  { name: "Physics", slug: "physics", description: "Foundational physics concepts explained with equations and intuition." },
  { name: "Mechanics", slug: "mechanics", description: "Motion, forces, energy, momentum, and Newtonian systems." },
  { name: "Electricity & Magnetism", slug: "electricity-and-magnetism", description: "Charge, fields, circuits, magnetism, and electromagnetic ideas." },
  { name: "Chemistry", slug: "chemistry", description: "Matter, reactions, stoichiometry, bonding, and chemical reasoning." },
  { name: "Organic Chemistry", slug: "organic-chemistry", description: "Structure, reactions, mechanisms, and functional groups." },
  { name: "Biology", slug: "biology", description: "Cells, genetics, evolution, physiology, and experimental biology." },
  { name: "Statistics", slug: "statistics", description: "Data summaries, probability, inference, and statistical thinking." },
  { name: "Linear Algebra", slug: "linear-algebra", description: "Vectors, matrices, systems, transformations, and vector spaces." },
  { name: "Differential Equations", slug: "differential-equations", description: "Equations involving rates of change and their solutions." },
  { name: "Computer Science", slug: "computer-science", description: "Programming concepts, computation, systems, and problem solving." },
  { name: "Data Structures", slug: "data-structures", description: "Arrays, lists, stacks, queues, trees, graphs, and hash tables." },
  { name: "Algorithms", slug: "algorithms", description: "Efficient procedures for searching, sorting, optimization, and analysis." },
  { name: "Lab Reports", slug: "lab-reports", description: "Scientific writing, methods, results, analysis, and conclusions." },
  { name: "Graphing / Data Visualization", slug: "graphing-data-visualization", description: "Graphs, functions, plots, charts, and visual interpretation of data." },
];

export const studyTopics: StudyTopic[] = [
  {
    title: "What is the derivative of x^2?",
    slug: "derivative-of-x-squared",
    category: "Calculus",
    categorySlug: "calculus",
    description: "Learn why the derivative of x squared is 2x using the power rule and the limit definition.",
    problem: "Find the derivative of $f(x) = x^2$ and explain what the result means.",
    metaDescription: "Step-by-step explanation of the derivative of x squared, including the power rule, the limit definition, and the meaning of 2x.",
    content: `
## Problem Statement

Find the derivative of $f(x) = x^2$ and explain what the derivative means.

## Step-by-Step Solution

The derivative tells us the instantaneous rate of change of a function. For $f(x) = x^2$, we want to know how quickly the output changes at any input $x$.

Using the power rule:

$$
\\frac{d}{dx}x^n = nx^{n-1}
$$

Here, $n = 2$, so:

$$
\\frac{d}{dx}x^2 = 2x^{2-1} = 2x
$$

We can also see this from the limit definition:

$$
f'(x) = \\lim_{h \\to 0}\\frac{f(x+h)-f(x)}{h}
$$

Substitute $f(x) = x^2$:

$$
f'(x) = \\lim_{h \\to 0}\\frac{(x+h)^2-x^2}{h}
$$

Expand the numerator:

$$
(x+h)^2-x^2 = x^2+2xh+h^2-x^2 = 2xh+h^2
$$

So:

$$
f'(x) = \\lim_{h \\to 0}\\frac{2xh+h^2}{h}
$$

Factor out $h$:

$$
f'(x) = \\lim_{h \\to 0}(2x+h)
$$

Now let $h$ approach $0$:

$$
f'(x) = 2x
$$

## Final Answer

The derivative of $x^2$ is:

$$
\\boxed{2x}
$$

This means the slope of the graph $y = x^2$ at any point $x$ is $2x$. For example, at $x=3$, the slope is $6$.
`.trim(),
  },
  {
    title: "How do you use integration by parts?",
    slug: "integration-by-parts",
    category: "Calculus",
    categorySlug: "calculus",
    description: "A clear walkthrough of integration by parts using the classic integral of x times e to the x.",
    problem: "Use integration by parts to evaluate $\\int x e^x\\,dx$.",
    metaDescription: "Learn integration by parts step by step with the example integral of x e to the x dx.",
    content: `
## Problem Statement

Use integration by parts to evaluate:

$$
\\int x e^x\\,dx
$$

## Step-by-Step Solution

Integration by parts is useful when an integral is a product of two expressions. The formula is:

$$
\\int u\\,dv = uv - \\int v\\,du
$$

For this problem, choose:

$$
u = x
$$

and:

$$
dv = e^x\\,dx
$$

Now compute $du$ and $v$:

$$
du = dx
$$

$$
v = \\int e^x\\,dx = e^x
$$

Substitute into the integration by parts formula:

$$
\\int x e^x\\,dx = x e^x - \\int e^x\\,dx
$$

The remaining integral is straightforward:

$$
\\int e^x\\,dx = e^x
$$

Therefore:

$$
\\int x e^x\\,dx = x e^x - e^x + C
$$

Factor if desired:

$$
\\int x e^x\\,dx = e^x(x-1)+C
$$

## Final Answer

$$
\\boxed{\\int x e^x\\,dx = e^x(x-1)+C}
$$

The key idea is to choose $u$ as the part that becomes simpler when differentiated. Here, $x$ becomes $1$, which makes the integral easier.
`.trim(),
  },
  {
    title: "How do you solve quadratic equations?",
    slug: "solving-quadratic-equations",
    category: "Algebra",
    categorySlug: "algebra",
    description: "Solve quadratic equations with factoring and the quadratic formula.",
    problem: "Solve $x^2 - 5x + 6 = 0$ and explain the method.",
    metaDescription: "Step-by-step guide to solving quadratic equations, with factoring and the quadratic formula explained.",
    content: `
## Problem Statement

Solve the quadratic equation:

$$
x^2 - 5x + 6 = 0
$$

## Step-by-Step Solution

A quadratic equation has the general form:

$$
ax^2 + bx + c = 0
$$

For this equation:

$$
a = 1, \\quad b = -5, \\quad c = 6
$$

The fastest method here is factoring. We need two numbers that multiply to $6$ and add to $-5$.

Those numbers are $-2$ and $-3$, because:

$$
(-2)(-3)=6
$$

and:

$$
-2 + (-3) = -5
$$

So we can factor:

$$
x^2 - 5x + 6 = (x-2)(x-3)
$$

Now solve:

$$
(x-2)(x-3)=0
$$

By the zero product property, at least one factor must equal zero:

$$
x-2=0
$$

or:

$$
x-3=0
$$

Therefore:

$$
x=2
$$

or:

$$
x=3
$$

## Final Answer

$$
\\boxed{x=2 \\text{ or } x=3}
$$

If a quadratic does not factor nicely, use the quadratic formula:

$$
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$
`.trim(),
  },
  {
    title: "What is Newton's second law?",
    slug: "newtons-second-law",
    category: "Physics",
    categorySlug: "physics",
    description: "Understand Newton's second law, force, mass, and acceleration with a simple example.",
    problem: "Explain Newton's second law and find the acceleration of a 4 kg object pushed by a 20 N net force.",
    metaDescription: "Newton's second law explained clearly with the formula F equals ma and a worked force, mass, and acceleration example.",
    content: `
## Problem Statement

Explain Newton's second law and find the acceleration of a $4\\,\\text{kg}$ object pushed by a $20\\,\\text{N}$ net force.

## Step-by-Step Solution

Newton's second law says that the net force on an object equals its mass times its acceleration:

$$
F_{\\text{net}} = ma
$$

Here:

- $F_{\\text{net}}$ is the net force in newtons
- $m$ is mass in kilograms
- $a$ is acceleration in meters per second squared

We are given:

$$
F_{\\text{net}} = 20\\,\\text{N}
$$

and:

$$
m = 4\\,\\text{kg}
$$

We need to solve for acceleration, so rearrange the formula:

$$
a = \\frac{F_{\\text{net}}}{m}
$$

Substitute the values:

$$
a = \\frac{20}{4}
$$

So:

$$
a = 5\\,\\text{m/s}^2
$$

## Final Answer

The acceleration is:

$$
\\boxed{5\\,\\text{m/s}^2}
$$

Newton's second law means that larger net force creates larger acceleration, while larger mass makes the same force produce less acceleration.
`.trim(),
  },
  {
    title: "What are work and energy in physics?",
    slug: "work-and-energy-basics",
    category: "Physics",
    categorySlug: "physics",
    description: "Learn the relationship between work, force, displacement, and kinetic energy.",
    problem: "Explain work and energy, then find the work done by a 10 N force moving an object 3 m in the direction of the force.",
    metaDescription: "Work and energy basics in physics explained with W equals Fd and a simple worked example.",
    content: `
## Problem Statement

Explain work and energy, then find the work done by a $10\\,\\text{N}$ force moving an object $3\\,\\text{m}$ in the direction of the force.

## Step-by-Step Solution

In physics, work is done when a force causes displacement. If the force and motion point in the same direction, work is:

$$
W = Fd
$$

where:

- $W$ is work in joules
- $F$ is force in newtons
- $d$ is displacement in meters

We are given:

$$
F = 10\\,\\text{N}
$$

and:

$$
d = 3\\,\\text{m}
$$

Substitute into the formula:

$$
W = (10)(3)
$$

So:

$$
W = 30\\,\\text{J}
$$

Energy is the ability to do work. When work is done on an object, energy is transferred. For example, positive work on an object can increase its kinetic energy.

## Final Answer

The work done is:

$$
\\boxed{30\\,\\text{J}}
$$

The main idea is that work measures energy transfer caused by a force acting through a distance.
`.trim(),
  },
  {
    title: "How does the unit circle work?",
    slug: "unit-circle-explained",
    category: "Trigonometry",
    categorySlug: "trigonometry",
    description: "Understand the unit circle and how cosine and sine come from x and y coordinates.",
    problem: "Explain the unit circle and identify $\\sin(\\theta)$ and $\\cos(\\theta)$ on it.",
    metaDescription: "Beginner-friendly unit circle explanation showing how sine and cosine relate to coordinates.",
    content: `
## Problem Statement

Explain the unit circle and identify $\\sin(\\theta)$ and $\\cos(\\theta)$ on it.

## Step-by-Step Solution

The unit circle is a circle with radius $1$ centered at the origin of the coordinate plane.

Its equation is:

$$
x^2 + y^2 = 1
$$

An angle $\\theta$ is usually measured from the positive $x$-axis. The point where the angle meets the circle has coordinates:

$$
(x,y)
$$

On the unit circle:

$$
x = \\cos(\\theta)
$$

and:

$$
y = \\sin(\\theta)
$$

So the point on the unit circle can be written as:

$$
(\\cos(\\theta), \\sin(\\theta))
$$

For example, at $\\theta = 0$:

$$
(\\cos(0), \\sin(0)) = (1,0)
$$

At $\\theta = \\frac{\\pi}{2}$:

$$
\\left(\\cos\\left(\\frac{\\pi}{2}\\right), \\sin\\left(\\frac{\\pi}{2}\\right)\\right) = (0,1)
$$

## Final Answer

On the unit circle:

$$
\\boxed{\\cos(\\theta) = x \\text{ and } \\sin(\\theta) = y}
$$

This is why the unit circle is so useful: it connects angles, coordinates, and trigonometric functions in one picture.
`.trim(),
  },
  {
    title: "What is the difference between mean, median, and mode?",
    slug: "mean-vs-median-vs-mode",
    category: "Statistics",
    categorySlug: "statistics",
    description: "Compare mean, median, and mode with a simple data set.",
    problem: "Find the mean, median, and mode of the data set $2, 3, 3, 7, 10$.",
    metaDescription: "Mean vs median vs mode explained step by step using a simple statistics example.",
    content: `
## Problem Statement

Find the mean, median, and mode of the data set:

$$
2, 3, 3, 7, 10
$$

## Step-by-Step Solution

The mean, median, and mode are all measures of center, but they describe the data in different ways.

The mean is the arithmetic average:

$$
\\text{mean} = \\frac{\\text{sum of values}}{\\text{number of values}}
$$

Add the values:

$$
2+3+3+7+10 = 25
$$

There are $5$ values, so:

$$
\\text{mean} = \\frac{25}{5}=5
$$

The median is the middle value when the data is ordered. The data is already ordered:

$$
2, 3, 3, 7, 10
$$

The middle value is:

$$
3
$$

The mode is the value that appears most often. The number $3$ appears twice, while the others appear once.

So the mode is:

$$
3
$$

## Final Answer

$$
\\boxed{\\text{mean}=5, \\quad \\text{median}=3, \\quad \\text{mode}=3}
$$

The mean is affected by large or small extreme values, while the median is often more resistant to outliers.
`.trim(),
  },
  {
    title: "What is a matrix in linear algebra?",
    slug: "what-is-a-matrix",
    category: "Linear Algebra",
    categorySlug: "linear-algebra",
    description: "A beginner-friendly explanation of matrices, entries, rows, columns, and dimensions.",
    problem: "Explain what a matrix is and identify the dimensions of $\\begin{bmatrix}1 & 2 & 3 \\\\ 4 & 5 & 6\\end{bmatrix}$.",
    metaDescription: "What is a matrix? Learn rows, columns, entries, and matrix dimensions with a clear example.",
    content: `
## Problem Statement

Explain what a matrix is and identify the dimensions of:

$$
\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6
\\end{bmatrix}
$$

## Step-by-Step Solution

A matrix is a rectangular arrangement of numbers, symbols, or expressions. The individual items inside a matrix are called entries.

This matrix has two horizontal rows:

$$
\\begin{bmatrix}
1 & 2 & 3
\\end{bmatrix}
$$

and:

$$
\\begin{bmatrix}
4 & 5 & 6
\\end{bmatrix}
$$

It also has three vertical columns:

$$
\\begin{bmatrix}
1 \\\\
4
\\end{bmatrix},
\\quad
\\begin{bmatrix}
2 \\\\
5
\\end{bmatrix},
\\quad
\\begin{bmatrix}
3 \\\\
6
\\end{bmatrix}
$$

Matrix dimensions are written as:

$$
\\text{rows} \\times \\text{columns}
$$

This matrix has $2$ rows and $3$ columns.

## Final Answer

The matrix has dimensions:

$$
\\boxed{2 \\times 3}
$$

Matrices are useful because they organize data and represent systems of equations, transformations, and many kinds of linear relationships.
`.trim(),
  },
  {
    title: "How do you write a lab report?",
    slug: "how-to-write-a-lab-report",
    category: "Lab Reports",
    categorySlug: "lab-reports",
    description: "Learn the main sections of a strong STEM lab report and what each section should accomplish.",
    problem: "Describe the standard structure of a lab report and explain what belongs in each section.",
    metaDescription: "How to write a lab report with a clear structure for title, abstract, methods, results, discussion, and conclusion.",
    content: `
## Problem Statement

Describe the standard structure of a lab report and explain what belongs in each section.

## Step-by-Step Solution

A lab report is a scientific explanation of what you tested, how you tested it, what happened, and what the results mean. A strong report is organized so another reader could understand and evaluate the experiment.

## 1. Title

The title should be specific. It should tell the reader what the experiment studied, not just say "Lab Report."

## 2. Abstract

The abstract is a short summary of the entire report. It usually includes the purpose, method, main result, and conclusion.

## 3. Objective or Purpose

This section explains the question the lab is trying to answer. A good objective is clear and testable.

## 4. Materials and Methods

List the materials used and describe the procedure. The goal is reproducibility: another student should be able to follow your method.

## 5. Data and Results

Present observations, measurements, tables, graphs, and calculations. Keep this section factual. Save interpretation for the discussion.

## 6. Analysis and Discussion

Explain what the results mean. Connect the data to the scientific concept, discuss patterns, and address sources of uncertainty.

## 7. Conclusion

State whether the results support the objective or hypothesis. Mention the key evidence and what could be improved in a future experiment.

## Final Answer

A strong lab report follows this structure:

$$
\\boxed{\\text{Title} \\to \\text{Abstract} \\to \\text{Purpose} \\to \\text{Methods} \\to \\text{Results} \\to \\text{Discussion} \\to \\text{Conclusion}}
$$

The most important habit is to separate results from interpretation: first show what happened, then explain what it means.
`.trim(),
  },
  {
    title: "How do you graph a function?",
    slug: "how-to-graph-a-function",
    category: "Graphing / Data Visualization",
    categorySlug: "graphing-data-visualization",
    description: "A practical method for graphing a function by making a table and plotting points.",
    problem: "Graph the function $y = x^2 - 1$ by finding key points and describing the shape.",
    metaDescription: "Learn how to graph a function step by step using y equals x squared minus 1 as an example.",
    content: `
## Problem Statement

Graph the function:

$$
y = x^2 - 1
$$

by finding key points and describing the shape.

## Step-by-Step Solution

To graph a function, choose several input values, compute the corresponding output values, plot the points, and connect them according to the function's shape.

For:

$$
y = x^2 - 1
$$

make a table of values:

| $x$ | $y = x^2 - 1$ |
| --- | --- |
| $-2$ | $3$ |
| $-1$ | $0$ |
| $0$ | $-1$ |
| $1$ | $0$ |
| $2$ | $3$ |

So the points are:

$$
(-2,3),\\;(-1,0),\\;(0,-1),\\;(1,0),\\;(2,3)
$$

Because the function contains $x^2$, its graph is a parabola. The coefficient of $x^2$ is positive, so the parabola opens upward.

The lowest point is the vertex:

$$
(0,-1)
$$

The graph crosses the $x$-axis at:

$$
(-1,0) \\text{ and } (1,0)
$$

## Final Answer

The graph of $y = x^2 - 1$ is an upward-opening parabola with vertex:

$$
\\boxed{(0,-1)}
$$

and $x$-intercepts:

$$
\\boxed{(-1,0) \\text{ and } (1,0)}
$$
`.trim(),
  },
];

const relatedTopicSlugsByCategory: Record<string, string[]> = {
  geometry: ["unit-circle-explained", "how-to-graph-a-function"],
  mechanics: ["newtons-second-law", "work-and-energy-basics"],
  "electricity-and-magnetism": ["work-and-energy-basics", "newtons-second-law"],
  chemistry: ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  "organic-chemistry": ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  biology: ["how-to-write-a-lab-report", "mean-vs-median-vs-mode"],
  "differential-equations": ["derivative-of-x-squared", "integration-by-parts"],
  "computer-science": ["what-is-a-matrix", "how-to-graph-a-function"],
  "data-structures": ["what-is-a-matrix", "how-to-graph-a-function"],
  algorithms: ["how-to-graph-a-function", "mean-vs-median-vs-mode"],
};

export function getCategory(categorySlug: string) {
  return studyCategories.find((category) => category.slug === categorySlug);
}

export function getCategoryHref(category: Pick<StudyCategory, "slug">) {
  return `/study-topics/${category.slug}`;
}

export function getTopicsForCategory(categorySlug: string) {
  return studyTopics.filter((topic) => topic.categorySlug === categorySlug);
}

export function getRelatedTopicsForCategory(categorySlug: string) {
  return (relatedTopicSlugsByCategory[categorySlug] ?? [])
    .map((slug) => studyTopics.find((topic) => topic.slug === slug))
    .filter((topic): topic is StudyTopic => Boolean(topic));
}

export function getVisibleTopicsForCategory(categorySlug: string) {
  const topics = getTopicsForCategory(categorySlug);
  return topics.length ? topics : getRelatedTopicsForCategory(categorySlug);
}

export function getTopic(categorySlug: string, slug: string) {
  return studyTopics.find((topic) => topic.categorySlug === categorySlug && topic.slug === slug);
}

export function getTopicHref(topic: Pick<StudyTopic, "categorySlug" | "slug">) {
  return `/study-topics/${topic.categorySlug}/${topic.slug}`;
}
