from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import TutorSession, TutorMessage
from .serializers import TutorSessionSerializer, TutorMessageSerializer
from .engine import tutor_engine
from courses.models import Course, Lesson

class TutorProviderStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_info = tutor_engine.check_provider_status()
        return Response(status_info)

class ChatWithTutorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('message', '').strip()
        if not query:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        provider = request.data.get('provider', 'ollama').lower()
        mode = request.data.get('mode', 'general')
        session_id = request.data.get('session_id')
        course_id = request.data.get('course_id')
        lesson_id = request.data.get('lesson_id')
        gemini_api_key = request.data.get('gemini_api_key')

        course = None
        lesson = None
        course_context = None
        lesson_context = None

        if course_id:
            try:
                course = Course.objects.get(pk=course_id)
                course_context = f"Course: {course.title}\nCategory: {course.category.name if course.category else 'General'}\nDescription: {course.description}"
            except Course.DoesNotExist:
                pass

        if lesson_id:
            try:
                lesson = Lesson.objects.get(pk=lesson_id)
                lesson_context = f"Lesson: {lesson.title} (Order: {lesson.sequence_order})\nContent Summary: {lesson.description}\nFull Lesson Material:\n{lesson.content}"
            except Lesson.DoesNotExist:
                pass

        # Retrieve or create session
        session = None
        if session_id:
            try:
                session = TutorSession.objects.get(pk=session_id, user=request.user)
            except TutorSession.DoesNotExist:
                session = None

        if not session:
            session_title = query[:40] + ("..." if len(query) > 40 else "")
            session = TutorSession.objects.create(
                user=request.user,
                course=course,
                lesson=lesson,
                title=session_title,
                provider=provider
            )

        # Collect past messages in session
        past_messages = []
        for msg in session.messages.order_by('created_at')[:6]:
            past_messages.append({
                'role': msg.role,
                'content': msg.content
            })

        # Record User Message
        user_message_obj = TutorMessage.objects.create(
            session=session,
            role='user',
            content=query,
            provider_used=provider,
            mode=mode
        )

        try:
            # Generate AI tutor response via LangChain
            result = tutor_engine.generate_response(
                query=query,
                provider=provider,
                mode=mode,
                course_context=course_context,
                lesson_context=lesson_context,
                chat_history=past_messages,
                gemini_api_key=gemini_api_key
            )

            assistant_text = result['content']
            model_name = result['model_name']

            # Record Assistant Message
            assistant_message_obj = TutorMessage.objects.create(
                session=session,
                role='assistant',
                content=assistant_text,
                provider_used=provider,
                mode=mode
            )

            # Award +5 curiosity XP for learning with the AI tutor
            request.user.add_points(5)

            return Response({
                'session_id': session.id,
                'session_title': session.title,
                'message': TutorMessageSerializer(assistant_message_obj).data,
                'provider': provider,
                'model_name': model_name,
                'mode': mode,
                'user_points': request.user.points,
                'user_level': request.user.level,
            })

        except Exception as e:
            return Response({
                'error': str(e),
                'session_id': session.id,
                'provider': provider,
                'suggestion': "If Gemini is unavailable or key is missing, switch to Ollama Qwen2.5:3B, or configure your GEMINI_API_KEY."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TutorSessionListView(generics.ListAPIView):
    serializer_class = TutorSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TutorSession.objects.filter(user=self.request.user).prefetch_related('messages')

class TutorSessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = TutorSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return TutorSession.objects.filter(user=self.request.user).prefetch_related('messages')
