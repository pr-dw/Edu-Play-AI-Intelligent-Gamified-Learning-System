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

        if not course_id:
            return Response({
                'error': 'Course selection is required. The AI Tutor only answers questions based on specific courses you are currently enrolled in or have completed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        from courses.models import Course, Lesson, Enrollment
        course = Course.objects.filter(pk=course_id).first()
        if not course:
            return Response({'error': 'Selected course was not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce that user is currently enrolled in or has completed this course
        enrollment = Enrollment.objects.filter(user=request.user, course=course).first()
        if not enrollment:
            return Response({
                'error': f"Access restricted. You must be enrolled in '{course.title}' to consult the AI Tutor."
            }, status=status.HTTP_403_FORBIDDEN)

        all_lessons = list(course.lessons.all().order_by('sequence_order'))
        total_lessons = len(all_lessons)
        lessons_outline = "\n".join([
            f"- Lesson {l.sequence_order}: {l.title} ({l.description or 'No summary'})"
            for l in all_lessons
        ])

        course_context = (
            f"Course Title: {course.title}\n"
            f"Total Lessons in Course: {total_lessons}\n"
            f"Category: {course.category.name if course.category else 'General'}\n"
            f"Description: {course.description}\n"
            f"Syllabus Outline:\n{lessons_outline if lessons_outline else 'No lessons in syllabus'}"
        )

        lesson = None
        lesson_context = None
        if lesson_id:
            lesson = Lesson.objects.filter(pk=lesson_id, course=course).first()
            if lesson:
                # Determine next lesson availability in the course sequence
                next_lesson = course.lessons.filter(sequence_order__gt=lesson.sequence_order).order_by('sequence_order').first()
                if next_lesson:
                    upcoming_info = f"Lesson {next_lesson.sequence_order}: '{next_lesson.title}'"
                else:
                    if total_lessons <= 1:
                        upcoming_info = "NONE (This course consists of ONLY 1 single lesson. There is NO next lesson)."
                    else:
                        upcoming_info = "NONE (This is the final lesson of the course. There are no further lessons)."

                lesson_context = (
                    f"Active Lesson: Lesson {lesson.sequence_order} of {total_lessons} ('{lesson.title}')\n"
                    f"Next Lesson in Syllabus: {upcoming_info}\n"
                    f"Active Lesson Content:\n{lesson.content}"
                )

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
