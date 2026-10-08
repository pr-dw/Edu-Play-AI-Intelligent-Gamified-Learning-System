import os
import logging
from typing import Dict, Any, List, Optional
from django.conf import settings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

class AITutorEngine:
    """
    EduPlay AI Personal Tutor Engine built with LangChain.
    Supports switching seamlessly between Google Gemini API and local Ollama Qwen2.5:3B.
    """

    def __init__(self):
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')
        self.gemini_model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        self.default_provider = os.getenv('DEFAULT_AI_PROVIDER', 'ollama')

    def check_provider_status(self) -> Dict[str, Any]:
        """Checks availability of both Ollama and Gemini providers."""
        import requests
        
        # Check Ollama
        ollama_available = False
        ollama_models = []
        try:
            res = requests.get(f"{self.ollama_base_url}/api/tags", timeout=2)
            if res.status_code == 200:
                ollama_available = True
                models_data = res.json().get('models', [])
                ollama_models = [m.get('name') for m in models_data]
        except Exception as e:
            logger.warning(f"Ollama connection check failed: {e}")

        # Check Gemini API Key
        env_gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
        gemini_configured = bool(env_gemini_key)

        return {
            'default_provider': self.default_provider,
            'ollama': {
                'available': ollama_available,
                'model': self.ollama_model,
                'base_url': self.ollama_base_url,
                'detected_models': ollama_models,
                'ready': self.ollama_model in [m.split(':')[0] for m in ollama_models] or any('qwen' in m for m in ollama_models)
            },
            'gemini': {
                'available': gemini_configured,
                'model': self.gemini_model,
                'key_configured': gemini_configured,
            }
        }

    def get_llm(self, provider: str, gemini_api_key: Optional[str] = None):
        """Initializes and returns the selected LangChain chat model."""
        provider = provider.lower()

        if provider == 'gemini':
            api_key = gemini_api_key or os.getenv('GEMINI_API_KEY', '').strip()
            if not api_key:
                raise ValueError(
                    "Google Gemini API key is missing. Please provide a GEMINI_API_KEY in your environment, "
                    "or enter your API key in the UI, or switch to 'Ollama Qwen2.5:3B'."
                )
            
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=self.gemini_model,
                    google_api_key=api_key,
                    temperature=0.7,
                ), self.gemini_model
            except Exception as e:
                logger.error(f"Failed to initialize ChatGoogleGenerativeAI: {e}")
                raise RuntimeError(f"Could not initialize Gemini model: {str(e)}")

        elif provider == 'ollama':
            try:
                from langchain_ollama import ChatOllama
                return ChatOllama(
                    model=self.ollama_model,
                    base_url=self.ollama_base_url,
                    temperature=0.7,
                ), f"Ollama {self.ollama_model}"
            except Exception as e:
                logger.error(f"Failed to initialize ChatOllama: {e}")
                raise RuntimeError(
                    f"Could not connect to Ollama ({self.ollama_base_url}). Ensure Ollama service is running. Error: {str(e)}"
                )
        else:
            raise ValueError(f"Unsupported AI Provider '{provider}'. Choose 'ollama' or 'gemini'.")

    def build_system_prompt(self, course_context: Optional[str], lesson_context: Optional[str], mode: str) -> str:
        mode_instructions = {
            'explain': "Focus on explaining concepts in intuitive, clear language with relatable everyday analogies.",
            'summarize': "Provide a sharp, well-structured executive summary and bullet points of the key learning takeaways.",
            'examples': "Provide practical, step-by-step code or real-world application examples demonstrating the concept in action.",
            'quiz_hint': "Act as a Socratic tutor! Give a gentle clue, conceptual guiding hint, or practice question without revealing the answer directly.",
            'doubt_solver': "Break down the student's question systematically, explain the 'why' behind each point, and offer guidance on how to avoid common pitfalls.",
            'general': "Provide helpful, encouraging, and pedagogically rich academic guidance directly relevant to this course."
        }

        mode_text = mode_instructions.get(mode, mode_instructions['general'])

        context_block = ""
        if course_context or lesson_context:
            context_block = f"""
=== ENROLLED COURSE CURRICULUM MATERIAL ===
{course_context or ''}
{lesson_context or ''}
==========================================
"""

        system_prompt = f"""You are the EduPlay AI Personal Tutor for an intelligent gamified e-learning platform.
You are strictly dedicated to assisting the student with the specific enrolled course curriculum detailed below.

Current Tutoring Mode: [{mode.upper()}]
{mode_text}
{context_block}

CRITICAL RULES & SCOPE ENFORCEMENT:
1. STRICT BOUNDARY: You are only permitted to answer questions that are directly relevant to this specific course and its educational syllabus.
2. DISALLOW GENERAL QUESTIONS: DO NOT answer generic questions, general chatter, unrelated trivia, or off-topic inquiries that do not relate to this enrolled course.
3. If the student asks an off-topic or general question, politely and concisely refuse:
   "I am your EduPlay AI Tutor dedicated to this course curriculum. I can only answer questions and resolve doubts related to this course. Please ask a question related to this curriculum!"
4. Professional, supportive, and pedagogically sound tone.
5. Format answers using clear Markdown with bullet points and syntax-highlighted code blocks where appropriate.
"""
        return system_prompt

    def generate_response(
        self,
        query: str,
        provider: str = 'ollama',
        mode: str = 'general',
        course_context: Optional[str] = None,
        lesson_context: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        gemini_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a LangChain chain for the tutor query using the chosen provider.
        """
        llm, model_name = self.get_llm(provider, gemini_api_key)
        system_content = self.build_system_prompt(course_context, lesson_context, mode)

        # Build message history for LangChain
        messages = [SystemMessage(content=system_content)]

        if chat_history:
            for item in chat_history[-6:]:  # Keep recent context window
                role = item.get('role', 'user')
                content = item.get('content', '')
                if role == 'user':
                    messages.append(HumanMessage(content=content))
                elif role in ('assistant', 'ai'):
                    messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=query))

        prompt = ChatPromptTemplate.from_messages(messages)
        chain = prompt | llm | StrOutputParser()

        response_text = chain.invoke({})

        return {
            'content': response_text,
            'provider': provider,
            'model_name': model_name,
            'mode': mode,
        }

tutor_engine = AITutorEngine()
