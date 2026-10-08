import type { SkillMapContent } from "./knowledge.schemas.js";

/**
 * Hand-curated knowledge maps for the big tracks. Concept chapters are still written on first open,
 * but the structure (what to learn, in what order, how important it is) is fixed here.
 *
 * Each row: [title, difficulty 1-5, interview frequency 1-5, importance].
 */
type Row = [string, number, number, "MUST" | "GOOD" | "ADVANCED", string[]?];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function domain(key: string, title: string, rows: Row[]) {
  return {
    key,
    title,
    concepts: rows.map(([t, difficulty, frequency, importance, prerequisites]) => ({ key: slug(t), title: t, difficulty, frequency, importance, prerequisites: (prerequisites ?? []).map(slug) })),
  };
}

const SYSTEM_DESIGN: SkillMapContent = {
  summary:
    "Designing software that keeps working as users, data and traffic grow: choosing components, estimating load, and defending the trade-offs. Learn it in order — foundations, networking, data, caching, distribution — then practise on real case studies.",
  domains: [
    domain("foundation", "Foundation", [
      ["What is System Design?", 1, 5, "MUST"],
      ["Functional Requirements", 1, 5, "MUST"],
      ["Non-Functional Requirements", 1, 5, "MUST"],
      ["Scalability", 2, 5, "MUST"],
      ["Availability", 2, 5, "MUST"],
      ["Reliability", 2, 4, "MUST"],
      ["Performance", 2, 4, "MUST"],
      ["Latency", 2, 5, "MUST"],
      ["Throughput", 2, 4, "MUST"],
      ["Capacity Estimation", 3, 5, "MUST", ["Throughput"]],
    ]),
    domain("networking", "Networking", [
      ["DNS", 2, 4, "MUST"],
      ["HTTP", 1, 5, "MUST"],
      ["HTTPS", 2, 4, "MUST", ["HTTP"]],
      ["TCP", 2, 4, "MUST"],
      ["UDP", 2, 3, "GOOD", ["TCP"]],
      ["WebSockets", 3, 4, "MUST", ["HTTP"]],
      ["REST", 2, 5, "MUST", ["HTTP"]],
      ["gRPC", 3, 3, "GOOD", ["REST"]],
      ["Load Balancers", 2, 5, "MUST", ["HTTP"]],
      ["Reverse Proxy", 2, 3, "GOOD", ["Load Balancers"]],
      ["API Gateway", 3, 4, "MUST", ["Reverse Proxy"]],
      ["CDN", 2, 5, "MUST", ["DNS"]],
    ]),
    domain("database", "Database", [
      ["SQL Databases", 2, 5, "MUST"],
      ["NoSQL Databases", 2, 5, "MUST"],
      ["Database Indexing", 3, 5, "MUST", ["SQL Databases"]],
      ["Transactions", 3, 4, "MUST", ["SQL Databases"]],
      ["ACID", 3, 4, "MUST", ["Transactions"]],
      ["Isolation Levels", 4, 3, "GOOD", ["ACID"]],
      ["Replication", 3, 5, "MUST"],
      ["Read Replicas", 3, 4, "MUST", ["Replication"]],
      ["Sharding", 4, 5, "MUST", ["Replication"]],
      ["Partitioning", 3, 4, "GOOD", ["Sharding"]],
      ["Database Scaling", 3, 5, "MUST", ["Read Replicas", "Sharding"]],
      ["CAP Theorem", 3, 5, "MUST", ["Replication"]],
      ["Consistency Models", 4, 4, "GOOD", ["CAP Theorem"]],
    ]),
    domain("caching", "Caching", [
      ["Cache Fundamentals", 2, 5, "MUST"],
      ["Cache-Aside", 2, 5, "MUST", ["Cache Fundamentals"]],
      ["Read-Through Cache", 3, 3, "GOOD", ["Cache-Aside"]],
      ["Write-Through Cache", 3, 4, "GOOD", ["Cache-Aside"]],
      ["Write-Back Cache", 3, 3, "GOOD", ["Write-Through Cache"]],
      ["TTL", 1, 4, "MUST", ["Cache Fundamentals"]],
      ["LRU Eviction", 3, 4, "MUST", ["Cache Fundamentals"]],
      ["Cache Invalidation", 4, 5, "MUST", ["TTL"]],
      ["Redis", 2, 5, "MUST", ["Cache Fundamentals"]],
      ["Distributed Cache", 4, 3, "GOOD", ["Redis"]],
    ]),
    domain("distributed", "Distributed systems", [
      ["Distributed Systems Basics", 3, 4, "MUST"],
      ["Consensus", 5, 2, "ADVANCED", ["Distributed Systems Basics"]],
      ["Leader Election", 4, 3, "GOOD", ["Consensus"]],
      ["Failover", 3, 4, "MUST", ["Replication"]],
      ["Fault Tolerance", 3, 4, "MUST"],
      ["Distributed Locks", 4, 3, "GOOD", ["Redis"]],
      ["Idempotency", 3, 5, "MUST"],
      ["Eventual Consistency", 3, 4, "MUST", ["CAP Theorem"]],
      ["Strong Consistency", 3, 4, "MUST", ["CAP Theorem"]],
      ["Clock Skew and Ordering", 4, 2, "ADVANCED"],
    ]),
    domain("messaging", "Messaging", [
      ["Message Queues", 2, 5, "MUST"],
      ["Pub/Sub", 2, 4, "MUST", ["Message Queues"]],
      ["Kafka", 3, 4, "MUST", ["Pub/Sub"]],
      ["RabbitMQ", 3, 3, "GOOD", ["Message Queues"]],
      ["Producers and Consumers", 2, 4, "MUST", ["Message Queues"]],
      ["Partitions", 3, 3, "GOOD", ["Kafka"]],
      ["Consumer Groups", 3, 3, "GOOD", ["Kafka"]],
      ["Message Ordering", 4, 3, "GOOD", ["Partitions"]],
      ["Delivery Guarantees", 4, 4, "MUST", ["Idempotency"]],
      ["Dead-Letter Queues", 3, 3, "GOOD", ["Message Queues"]],
    ]),
    domain("architecture", "Architecture", [
      ["Monolith", 1, 4, "MUST"],
      ["Modular Monolith", 2, 3, "GOOD", ["Monolith"]],
      ["Microservices", 3, 5, "MUST", ["Monolith"]],
      ["Service Discovery", 3, 3, "GOOD", ["Microservices"]],
      ["Event-Driven Architecture", 3, 4, "MUST", ["Message Queues"]],
      ["Serverless", 2, 3, "GOOD"],
      ["Async Architecture", 3, 4, "MUST", ["Message Queues"]],
      ["Backend for Frontend", 3, 2, "ADVANCED", ["API Gateway"]],
    ]),
    domain("reliability", "Reliability", [
      ["Rate Limiting", 3, 5, "MUST"],
      ["Circuit Breakers", 3, 4, "MUST"],
      ["Retries and Backoff", 2, 4, "MUST", ["Idempotency"]],
      ["Timeouts", 2, 4, "MUST"],
      ["Backpressure", 4, 3, "GOOD", ["Message Queues"]],
      ["Health Checks", 2, 4, "MUST", ["Load Balancers"]],
      ["Graceful Degradation", 3, 3, "GOOD", ["Circuit Breakers"]],
    ]),
    domain("storage", "Storage", [
      ["Object Storage", 2, 4, "MUST"],
      ["File Storage", 2, 3, "GOOD"],
      ["Blob Storage", 2, 3, "GOOD", ["Object Storage"]],
      ["Content Delivery for Media", 3, 4, "MUST", ["CDN", "Object Storage"]],
      ["Data Partitioning for Storage", 3, 3, "GOOD", ["Partitioning"]],
      ["Data Lifecycle and Retention", 2, 2, "GOOD"],
    ]),
    domain("observability", "Observability", [
      ["Logging", 1, 4, "MUST"],
      ["Metrics", 2, 4, "MUST"],
      ["Distributed Tracing", 3, 3, "GOOD", ["Logging"]],
      ["Monitoring", 2, 4, "MUST", ["Metrics"]],
      ["Alerting", 2, 3, "GOOD", ["Monitoring"]],
      ["SLI", 3, 3, "GOOD", ["Metrics"]],
      ["SLO", 3, 3, "GOOD", ["SLI"]],
      ["SLA", 2, 3, "GOOD", ["SLO"]],
    ]),
    domain("security", "Security", [
      ["Authentication", 2, 5, "MUST"],
      ["Authorization", 2, 5, "MUST", ["Authentication"]],
      ["OAuth", 3, 4, "MUST", ["Authentication"]],
      ["JWT", 2, 5, "MUST", ["Authentication"]],
      ["Encryption", 3, 4, "MUST"],
      ["Secrets Management", 2, 3, "GOOD"],
      ["API Security", 3, 4, "MUST", ["Authentication"]],
      ["DDoS Protection", 3, 3, "GOOD", ["Rate Limiting", "CDN"]],
      ["OWASP Top 10", 2, 3, "GOOD"],
    ]),
    domain("case-studies", "Real system design", [
      ["Design a URL Shortener", 3, 5, "MUST", ["Capacity Estimation", "Database Indexing", "Cache-Aside"]],
      ["Design a Rate Limiter", 3, 5, "MUST", ["Rate Limiting", "Redis"]],
      ["Design WhatsApp", 4, 5, "MUST", ["WebSockets", "Message Queues"]],
      ["Design Instagram", 4, 5, "MUST", ["Object Storage", "CDN"]],
      ["Design Twitter", 4, 5, "MUST", ["Caching", "Sharding"]],
      ["Design YouTube", 4, 4, "MUST", ["CDN", "Object Storage"]],
      ["Design Netflix", 5, 4, "GOOD", ["CDN"]],
      ["Design Uber", 5, 4, "GOOD", ["WebSockets"]],
      ["Design a Food Delivery App", 4, 4, "GOOD"],
      ["Design a Payment System", 5, 4, "GOOD", ["Idempotency", "Transactions"]],
      ["Design a Notification System", 3, 4, "MUST", ["Message Queues"]],
      ["Design Google Drive", 4, 4, "GOOD", ["Object Storage"]],
      ["Design a Job Portal", 3, 3, "GOOD"],
      ["Design a Chat System", 4, 5, "MUST", ["WebSockets"]],
      ["Design Video Streaming", 5, 3, "GOOD", ["CDN"]],
      ["Design an E-commerce Platform", 4, 4, "GOOD", ["Transactions"]],
      ["Design Amazon Checkout", 5, 3, "ADVANCED", ["Distributed Transactions"]],
    ]),
    domain("advanced", "Advanced", [
      ["Distributed Transactions", 5, 3, "ADVANCED", ["Transactions"]],
      ["Saga Pattern", 4, 3, "ADVANCED", ["Distributed Transactions"]],
      ["CQRS", 4, 3, "ADVANCED"],
      ["Event Sourcing", 5, 2, "ADVANCED", ["Event-Driven Architecture"]],
      ["Consistent Hashing", 4, 4, "GOOD", ["Sharding"]],
      ["Vector Databases", 3, 3, "GOOD"],
      ["Search Systems", 4, 3, "GOOD", ["Database Indexing"]],
      ["Recommendation Systems", 4, 2, "ADVANCED"],
      ["Real-Time Systems", 4, 3, "GOOD", ["WebSockets"]],
      ["Multi-Region Architecture", 5, 2, "ADVANCED", ["Replication"]],
      ["Disaster Recovery", 4, 3, "GOOD", ["Failover"]],
      ["Chaos Engineering", 4, 2, "ADVANCED", ["Fault Tolerance"]],
    ]),
  ],
  related: ["Distributed Systems", "Databases", "Computer Networks", "Redis", "Kafka", "Docker", "Kubernetes", "AWS"],
};

/** Curated maps by canonical skill key. Also open to every learner (not only resume skills). */
export const CURATED_MAPS: Record<string, { name: string; content: SkillMapContent }> = {
  "system design": { name: "System Design", content: SYSTEM_DESIGN },
};

export const CURATED_TRACKS = Object.entries(CURATED_MAPS).map(([key, m]) => ({
  key,
  name: m.name,
  concepts: m.content.domains.reduce((n, d) => n + d.concepts.length, 0),
  domains: m.content.domains.length,
}));
