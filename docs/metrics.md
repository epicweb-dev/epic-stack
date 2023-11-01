# Metrics

Epic Stack apps use **Prometheus** for metrics tracking.

### Why Prometheus?

Prometheus is an open-source systems monitoring and alerting toolkit. It's known for its reliability and scalability, making it a top choice for monitoring in modern cloud-native environments.

### SQL Query Metrics (built in)

Epic Stack apps provide:
- **Count**: Number of SQL queries executed.
- **Duration**: Time taken for each SQL query.

Access the Prometheus dashboard for real-time metrics on port 9091
By default (in the .env.example) metrics is disabled locally, this can be enabled by change the `ENABLE_METRICS` enviorment variable to `true` for local testing. There is no need to add this variable to your deployed app. 

### Conclusion
Metrics are crucial for maintaining the health and performance of your application. With Epic Stack's built-in Prometheus integration and SQL query metrics, you're well-equipped to monitor, debug, and optimize your app for the best user experience.