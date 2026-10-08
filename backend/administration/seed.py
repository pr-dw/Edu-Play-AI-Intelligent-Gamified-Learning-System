import logging
from django.contrib.auth import get_user_model
from courses.models import Category, Course, Lesson, Enrollment, LessonProgress
from certificates.models import Certificate
from administration.models import PlatformSetting

logger = logging.getLogger(__name__)
User = get_user_model()

def seed_database():
    """Seeds default accounts, courses, lessons, and settings with user/admin roles."""
    # 1. Platform Settings
    PlatformSetting.set_setting('DEFAULT_AI_PROVIDER', 'ollama', 'Default AI provider for tutor')
    PlatformSetting.set_setting('SITE_TITLE', 'EduPlay AI', 'Platform brand name')
    PlatformSetting.set_setting('ANNOUNCEMENT', 'Welcome to EduPlay AI! Ask questions to the AI Tutor to earn bonus XP.', 'Banner announcement')

    # 2. Create Demo Accounts
    # Admin User
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@eduplay.ai',
            'first_name': 'Platform',
            'last_name': 'Admin',
            'role': 'admin',
            'points': 1500,
            'level': 6,
            'is_staff': True,
            'is_superuser': True,
            'avatar': '👑',
            'bio': 'System administrator overseeing platform curriculums and intelligence.'
        }
    )
    # Always ensure admin password is set to 123456
    admin.set_password('123456')
    admin.save()

    # User 1 (Prabhat) - rename sam if exists, or create prabhat
    old_sam = User.objects.filter(username='sam').first()
    if old_sam:
        old_sam.username = 'prabhat'
        old_sam.first_name = 'Prabhat'
        old_sam.email = 'prabhat@eduplay.ai'
        old_sam.set_password('123456')
        old_sam.save()
        user_prabhat = old_sam
    else:
        user_prabhat, created = User.objects.get_or_create(
            username='prabhat',
            defaults={
                'email': 'prabhat@eduplay.ai',
                'first_name': 'Prabhat',
                'last_name': '',
                'role': 'user',
                'points': 320,
                'level': 2,
                'avatar': '⚡',
                'bio': 'Lifelong learner curious about AI systems and software engineering.'
            }
        )
        user_prabhat.set_password('123456')
        user_prabhat.save()

    # User 2 (Alex)
    user_alex, created = User.objects.get_or_create(
        username='alex',
        defaults={
            'email': 'alex@eduplay.ai',
            'first_name': 'Alex',
            'last_name': 'Morgan',
            'role': 'user',
            'points': 580,
            'level': 3,
            'avatar': '🧠',
            'bio': 'Passionate builder exploring deep learning and full-stack development.'
        }
    )
    user_alex.set_password('123456')
    user_alex.save()

    # 3. Categories
    cat_ai, _ = Category.objects.get_or_create(name='Artificial Intelligence', defaults={'icon': '🧠'})
    cat_web, _ = Category.objects.get_or_create(name='Full-Stack Web Dev', defaults={'icon': '💻'})
    cat_ds, _ = Category.objects.get_or_create(name='Data Science & Python', defaults={'icon': '📊'})

    # 4. Courses and Lessons
    # Course 1: LangChain & Modern AI Engineering
    c1, _ = Course.objects.get_or_create(
        title='LangChain & Intelligent Agents Masterclass',
        defaults={
            'description': 'Master the foundations of Large Language Models, prompt chaining, retrieval-augmented generation (RAG), and agentic workflows using LangChain with Gemini and Ollama.',
            'category': cat_ai,
            'author': admin,
            'level': 'Intermediate',
            'thumbnail': '🤖',
            'xp_reward': 600,
            'is_published': True
        }
    )

    Lesson.objects.get_or_create(
        course=c1, sequence_order=1,
        defaults={
            'title': 'Introduction to LLMs and Prompt Engineering',
            'description': 'Learn how foundational language models work, zero-shot vs few-shot prompting, and structuring system prompts.',
            'duration_minutes': 20,
            'xp_reward': 60,
            'content': """# Introduction to LLMs & Prompt Engineering

Large Language Models (LLMs) are deep neural networks trained on massive corpora of text to predict subsequent tokens and generate coherent human-like responses.

### Key Concepts
1. **Tokens**: Subword units used by LLMs to process text. Roughly 100 tokens ≈ 75 English words.
2. **Temperature**: Controls randomness. Temperature `0.0` yields deterministic, focused outputs, while `0.7` to `1.0` yields creative, varied responses.
3. **System Prompts**: Guide the persona, constraints, and instructions of the AI assistant before user interaction occurs.

### Best Practices in Prompt Engineering:
- **Role Assignment**: Clearly define the persona (e.g. *"You are an experienced computer science professor..."*).
- **Delimiters**: Use triple backticks or XML tags to separate context data from instructions.
- **Few-Shot Examples**: Provide 2-3 input-output pairs to illustrate the exact target output format.
"""
        }
    )

    Lesson.objects.get_or_create(
        course=c1, sequence_order=2,
        defaults={
            'title': 'LangChain Core: Chains, Runnables, and LCEL',
            'description': 'Explore LangChain Expression Language (LCEL) and chaining prompts with models and output parsers.',
            'duration_minutes': 25,
            'xp_reward': 70,
            'content': """# LangChain Expression Language (LCEL)

LangChain Expression Language (LCEL) is a declarative syntax for seamlessly composing chains of modular components.

### Core Architecture
A typical LCEL chain follows the pipe syntax:
```python
chain = prompt | model | output_parser
```

### Components
1. **PromptTemplate**: Formats input variables into structured chat messages.
2. **ChatModel**: Interfaces with providers such as Google Gemini (`ChatGoogleGenerativeAI`) or Ollama (`ChatOllama`).
3. **StrOutputParser**: Extracts the clean string response from the model's message container.

### Example in Python:
```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_ollama import ChatOllama

prompt = ChatPromptTemplate.from_template("Explain {concept} in 2 sentences.")
model = ChatOllama(model="qwen2.5:3b")
chain = prompt | model | StrOutputParser()

res = chain.invoke({"concept": "Recursion"})
print(res)
```
"""
        }
    )

    Lesson.objects.get_or_create(
        course=c1, sequence_order=3,
        defaults={
            'title': 'Local LLMs with Ollama vs Cloud APIs (Gemini)',
            'description': 'Understand offline private inference with Ollama versus scalable high-throughput cloud inference with Gemini.',
            'duration_minutes': 20,
            'xp_reward': 75,
            'content': """# Local Inference vs Cloud APIs

When designing AI applications, developers face architectural choices between on-device/local inference and cloud-hosted API models.

### Comparison Matrix
| Aspect | Local Ollama (e.g. Qwen2.5:3B) | Cloud APIs (Google Gemini) |
|---|---|---|
| **Privacy** | 100% on-device, no external network | Data sent to cloud endpoint |
| **Cost** | Free open-source inference | Pay-per-token or API quotas |
| **Latency** | Dependent on local CPU/GPU hardware | Fast datacenter inference |
| **Model Size** | Optimized small models (1B to 7B parameters) | Massive frontier models |

EduPlay AI offers both options to provide complete flexibility: zero-cost local privacy with Ollama, and cloud scalability with Gemini!
"""
        }
    )

    # Course 2: React & Modern Frontend Engineering
    c2, _ = Course.objects.get_or_create(
        title='React 18 & Modern Web Development',
        defaults={
            'description': 'Build responsive, reactive, and gamified web applications using React hooks, state management, and modern CSS architecture.',
            'category': cat_web,
            'author': admin,
            'level': 'Beginner',
            'thumbnail': '⚛️',
            'xp_reward': 500,
            'is_published': True
        }
    )

    Lesson.objects.get_or_create(
        course=c2, sequence_order=1,
        defaults={
            'title': 'React Fundamentals: Components & JSX',
            'description': 'Understand declarative UI, components, props, and JSX syntax.',
            'duration_minutes': 15,
            'xp_reward': 50,
            'content': """# React Fundamentals

React is a declarative, component-based JavaScript library for building interactive user interfaces.

### Core Concepts:
1. **JSX**: Syntax extension that allows writing HTML-like markup inside JavaScript.
2. **Components**: Reusable, self-contained UI blocks that accept inputs (props) and return JSX.
3. **Immutability**: React state must not be modified directly; state updates trigger efficient virtual DOM reconciliations.
"""
        }
    )

    Lesson.objects.get_or_create(
        course=c2, sequence_order=2,
        defaults={
            'title': 'State & Effect Hooks: useState and useEffect',
            'description': 'Master reactive state updates and lifecycle side-effects in functional components.',
            'duration_minutes': 25,
            'xp_reward': 60,
            'content': """# React Hooks: useState & useEffect

Hooks are special functions that let you hook into React state and lifecycle features from functional components.

### `useState`
```javascript
const [points, setPoints] = useState(100);
```

### `useEffect`
Runs side-effects like fetching API data, setting up subscriptions, or timers:
```javascript
useEffect(() => {
  fetch('/api/courses/')
    .then(res => res.json())
    .then(data => setCourses(data));
}, []); // Empty dependency array runs once on mount
```
"""
        }
    )

    # Course 3: Python Algorithms
    c3, _ = Course.objects.get_or_create(
        title='Python Algorithms & Problem Solving',
        defaults={
            'description': 'Develop computational thinking, Big-O analysis, sorting algorithms, and graph theory in Python.',
            'category': cat_ds,
            'author': admin,
            'level': 'Intermediate',
            'thumbnail': '🐍',
            'xp_reward': 550,
            'is_published': True
        }
    )

    Lesson.objects.get_or_create(
        course=c3, sequence_order=1,
        defaults={
            'title': 'Complexity Analysis & Big-O Notation',
            'description': 'Analyze time and space complexity of computational algorithms.',
            'duration_minutes': 20,
            'xp_reward': 50,
            'content': r"""# Big-O Notation & Complexity

Big-O notation characterizes the upper bound of an algorithm's execution time or space usage as the input size $n$ grows toward infinity.

### Common Complexities:
- $O(1)$: Constant time (Dictionary / Hash Table lookup)
- $O(\log n)$: Logarithmic time (Binary Search)
- $O(n)$: Linear time (Single array traversal)
- $O(n \log n)$: Linearithmic time (Merge Sort, Quick Sort average)
- $O(n^2)$: Quadratic time (Nested loops, Bubble Sort)
"""
        }
    )

    # 5. Enroll user_prabhat in Course 1 with Lesson 1 completed
    e1, _ = Enrollment.objects.get_or_create(user=user_prabhat, course=c1)
    for l in c1.lessons.all():
        LessonProgress.objects.get_or_create(enrollment=e1, lesson=l)
    
    first_lesson = c1.lessons.first()
    lp = LessonProgress.objects.filter(enrollment=e1, lesson=first_lesson).first()
    if lp:
        lp.is_completed = True
        lp.save()
    e1.update_progress()

    return {
        'message': 'Successfully seeded EduPlay AI PostgreSQL database.',
        'users_created': ['admin (pass: 123456)', 'prabhat (pass: 123456)', 'alex (pass: 123456)'],
        'courses_created': [c1.title, c2.title, c3.title],
    }
