/**
 * Target roles for "No-JD mode". Each role lists the skills and fundamentals an
 * interviewer for that role is expected to cover; they widen the skill universe the
 * validator accepts and steer GENERAL / CONCEPTUAL questions.
 */
export const TARGET_ROLES = {
  backend: {
    label: "Backend Developer",
    skills: ["Node.js", "Express", "Python", "Java", "REST APIs", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Authentication", "JWT", "Docker", "Git", "Testing"],
    concepts: ["HTTP", "REST", "Databases", "Indexing", "Transactions", "Caching", "Authentication", "Authorization", "Concurrency", "API design", "Scalability", "System design", "Data structures", "Algorithms", "OOP", "Operating systems", "Networking", "Security"],
  },
  frontend: {
    label: "Frontend Developer",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Redux", "Tailwind CSS", "REST APIs", "Git", "Testing", "Accessibility"],
    concepts: ["DOM", "Browser rendering", "Event loop", "Closures", "Promises", "State management", "Performance", "Accessibility", "Responsive design", "Security", "HTTP", "Caching", "Data structures", "Algorithms"],
  },
  fullstack: {
    label: "Full Stack Developer",
    skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "REST APIs", "SQL", "PostgreSQL", "MongoDB", "Redis", "Authentication", "JWT", "Docker", "Git", "Testing"],
    concepts: ["HTTP", "REST", "Event loop", "State management", "Databases", "Indexing", "Caching", "Authentication", "Security", "Performance", "API design", "System design", "Data structures", "Algorithms", "OOP"],
  },
  sde: {
    label: "Software Engineer",
    skills: ["Java", "C++", "Python", "JavaScript", "SQL", "Git", "Data structures", "Algorithms", "OOP"],
    concepts: ["Data structures", "Algorithms", "Time complexity", "OOP", "Design patterns", "DBMS", "Operating systems", "Networking", "Concurrency", "System design", "Testing", "Recursion", "Dynamic programming"],
  },
  data_analyst: {
    label: "Data Analyst",
    skills: ["SQL", "Python", "Pandas", "NumPy", "Excel", "Power BI", "Tableau", "Statistics", "Data visualization", "Data cleaning"],
    concepts: ["Statistics", "Joins", "Aggregation", "Window functions", "Hypothesis testing", "Data cleaning", "Data visualization", "Probability", "A/B testing", "Data modeling", "KPIs"],
  },
  devops: {
    label: "DevOps Engineer",
    skills: ["Linux", "Bash", "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Git", "Nginx", "Monitoring", "Python"],
    concepts: ["Networking", "Containers", "Orchestration", "Infrastructure as code", "CI/CD", "Observability", "Security", "Scalability", "High availability", "Operating systems"],
  },
  ml_engineer: {
    label: "ML Engineer",
    skills: ["Python", "NumPy", "Pandas", "scikit-learn", "PyTorch", "TensorFlow", "SQL", "Machine learning", "Deep learning", "LLMs", "Docker"],
    concepts: ["Statistics", "Linear algebra", "Bias-variance", "Overfitting", "Regularization", "Evaluation metrics", "Feature engineering", "Neural networks", "Transformers", "Model deployment", "Data structures", "Algorithms"],
  },
} as const;

export type TargetRoleKey = keyof typeof TARGET_ROLES;
export const TARGET_ROLE_KEYS = Object.keys(TARGET_ROLES) as [TargetRoleKey, ...TargetRoleKey[]];

export const roleOptions = () => TARGET_ROLE_KEYS.map((key) => ({ key, label: TARGET_ROLES[key].label }));
