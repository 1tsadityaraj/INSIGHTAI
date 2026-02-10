import json
from openai import OpenAI
from app.core.config import get_settings
from app.core.logger import logger
from app.models.schemas import ExecutionPlan, SubTask

settings = get_settings()

class PlannerService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def create_plan(self, query: str) -> ExecutionPlan:
        """
        Analyzes the user query and breaks it down into actionable subtasks.
        """
        logger.info(f"Creating plan for query: {query}")
        
        system_prompt = """
        You are an expert planning AI for a data analysis platform.
        Your goal is to break down a user's natural language query into a structured execution plan.

        Identify the intent and create subtasks. 
        Assign a 'data_source_type' to each subtask. 
        Allowed data_source_types: 
        - 'general_knowledge' (definitions, history, broad concepts)
        - 'market_data' (stock prices, market cap, financial trends)
        - 'crypto_data' (cryptocurrency prices, blockchain stats)
        
        Return the result as a JSON object matching the ExecutionPlan schema.
        """

        user_prompt = f"Query: {query}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            plan_dict = json.loads(content)
            
            # Ensure the output matches our schema
            if "original_query" not in plan_dict:
                plan_dict["original_query"] = query
            
            # If the LLM didn't return 'subtasks' key or format is slightly off, 
            # we might need validation here. Pydantic will validate validation error.
            
            return ExecutionPlan(**plan_dict)

        except Exception as e:
            logger.error(f"Error creating plan: {str(e)}")
            # Fallback plan in case of failure (or re-raise)
            # For now, we'll raise to let the caller handle it or return a basic plan
            raise e
