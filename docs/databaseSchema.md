# Database Schema

## chat_messages Table

This table stores chat messages for the application.

| Column Name | Data Type | Description |
|---|---|---|
| id | TEXT | Unique identifier for the message (UUID or timestamp). Primary Key. |
| content | TEXT | Content of the message. |
| role | TEXT | Role of the message sender ('user' or 'assistant'). |
| reasoning | TEXT | Reasoning provided by the assistant (if applicable). Nullable. |
| model_type | TEXT | The LLM model used to generate the response. |
| created_at | TIMESTAMP WITH TIME ZONE | Timestamp when the message was created. Automatically set on insertion. |

**Notes:**

- The `id` column is used as the primary key to uniquely identify each message. It can be a UUID or a timestamp string.
- The `role` column indicates whether the message is from the user or the assistant.
- The `reasoning` column is optional and stores the reasoning provided by the assistant model.
- The `model_type` column specifies which LLM model generated the assistant's response.
- The `created_at` column automatically records the timestamp when each message is added to the database.