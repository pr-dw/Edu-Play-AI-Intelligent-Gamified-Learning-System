from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login_ser = LoginSerializer()
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully! +100 Welcome XP unlocked!',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Interconnected stats from courses and certificates
        enrollments = getattr(user, 'enrollments', None)
        enrolled_count = enrollments.count() if enrollments else 0
        completed_count = enrollments.filter(is_completed=True).count() if enrollments else 0
        certificates_count = getattr(user, 'certificates', None).count() if hasattr(user, 'certificates') else 0

        # Rank calculation
        users_with_more_points = User.objects.filter(points__gt=user.points).count()
        rank = users_with_more_points + 1

        return Response({
            'points': user.points,
            'level': user.level,
            'rank': rank,
            'enrolled_courses': enrolled_count,
            'completed_courses': completed_count,
            'certificates_earned': certificates_count,
            'next_level_xp': user.level * 250,
            'current_level_progress': ((user.points % 250) / 250) * 100,
        })

class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        top_users = User.objects.filter(is_active=True).order_by('-points')[:10]
        data = []
        for rank, u in enumerate(top_users, start=1):
            data.append({
                'rank': rank,
                'id': u.id,
                'username': u.username,
                'name': f"{u.first_name} {u.last_name}".strip() or u.username,
                'role': u.role,
                'avatar': u.avatar,
                'points': u.points,
                'level': u.level,
            })
        return Response(data)
