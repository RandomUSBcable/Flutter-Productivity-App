import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Productivity App',
      theme: ThemeData.dark(),
      home: const SplashScreen(),
    );
  }
}

// Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const SignInPage()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          'Productivity App',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

// Sign-In Page
class SignInPage extends StatefulWidget {
  const SignInPage({super.key});
  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String _errorMessage = '';

  void _login() {
    if (_usernameController.text == 'admin' &&
        _passwordController.text == '0000') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomePage()),
      );
    } else {
      setState(() {
        _errorMessage = 'Invalid username or password';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 20),
                const Text(
                  'Sign In',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 30),
                TextField(
                  controller: _usernameController,
                  decoration: const InputDecoration(labelText: 'Username'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _login,
                  child: const Text('Sign In'),
                ),
                if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(_errorMessage,
                        style: const TextStyle(color: Colors.red)),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Home Page
// Home Page
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: const [
            Icon(Icons.person, size: 24), // 👤 User icon
            SizedBox(width: 8),
            Text('Hello User'),
          ],
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TaskPage()),
              ),
              child: const Text('Tasks'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PomodoroPage()),
              ),
              child: const Text('Pomodoro'),
            ),
          ],
        ),
      ),
    );
  }
}


// Pomodoro Timer Page
class PomodoroPage extends StatefulWidget {
  const PomodoroPage({super.key});
  @override
  State<PomodoroPage> createState() => _PomodoroPageState();
}

class _PomodoroPageState extends State<PomodoroPage> {
  Timer? _timer;
  int _totalSeconds = 1500; // Default 25 minutes
  int _remainingSeconds = 1500;
  bool _isRunning = false;

  void startTimer() {
    if (!_isRunning) {
      _isRunning = true;
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_remainingSeconds > 0) {
          setState(() {
            _remainingSeconds--;
          });
        } else {
          timer.cancel();
          _isRunning = false;
        }
      });
    }
  }

  void stopTimer() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    }
  }

  void resetTimer() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _remainingSeconds = _totalSeconds;
    });
  }

  void setCustomTime() async {
    final TimeOfDay? pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: _totalSeconds ~/ 3600,
        minute: (_totalSeconds % 3600) ~/ 60,
      ),
    );

    if (pickedTime != null) {
      setState(() {
        _totalSeconds = pickedTime.hour * 3600 + pickedTime.minute * 60;
        _remainingSeconds = _totalSeconds;
      });
    }
  }

  String _formatTime(int seconds) {
    final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return "$minutes:$secs";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pomodoro Timer')),
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 240,
                  height: 240,
                  child: CircularProgressIndicator(
                    value: _remainingSeconds / _totalSeconds,
                    strokeWidth: 10,
                    backgroundColor: Colors.grey[800],
                    valueColor: const AlwaysStoppedAnimation(Colors.white),
                  ),
                ),
                Text(
                  _formatTime(_remainingSeconds),
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: setCustomTime,
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[800]),
              child: const Text("Set Time"),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: startTimer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: const Text("Start"),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: stopTimer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: const Text("Stop"),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: resetTimer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueGrey,
                    padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                  child: const Text("Reset"),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


// Task Model
class Task {
  String title;
  String status;
  String description;
  DateTime? deadline;

  Task({
    required this.title,
    this.status = 'Ongoing',
    required this.description,
    this.deadline,
  });
}

// Task Page
class TaskPage extends StatefulWidget {
  const TaskPage({super.key});
  @override
  State<TaskPage> createState() => _TaskPageState();
}

class _TaskPageState extends State<TaskPage> {
  final List<Task> _tasks = [];

  int get completedTasks =>
      _tasks.where((task) => task.status == 'Completed').length;
  int get ongoingTasks =>
      _tasks.where((task) => task.status == 'Ongoing').length;
  int get notCompletedTasks =>
      _tasks.where((task) => task.status == 'Not Completed').length;

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Completed':
        return Colors.green.shade700;
      case 'Ongoing':
        return Colors.blue.shade700;
      case 'Not Completed':
        return Colors.red.shade700;
      default:
        return Colors.grey;
    }
  }

  void _deleteTask(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: const Text('Are you sure you want to delete this task?'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _tasks.removeAt(index);
              });
              Navigator.pop(context);
            },
            child: const Text('YES'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('NO'),
          ),
        ],
      ),
    );
  }

  void _changeStatus(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Task Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['Completed', 'Ongoing', 'Not Completed']
              .map(
                (status) => ListTile(
              title: Text(status),
              onTap: () {
                setState(() {
                  _tasks[index].status = status;
                });
                Navigator.pop(context);
              },
            ),
          )
              .toList(),
        ),
      ),
    );
  }

  Future<void> _sendTaskToBackend(Task task) async {
    final url = Uri.parse('https://example.com/api/tasks'); // Replace this
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'deadline': task.deadline?.toIso8601String(),
      }),
    );
    debugPrint(response.statusCode == 200 || response.statusCode == 201
        ? 'Task saved successfully'
        : 'Failed to save task: ${response.statusCode}');
  }

  void _showTaskDialog({int? index}) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    DateTime? selectedDeadline;

    if (index != null) {
      titleController.text = _tasks[index].title;
      descriptionController.text = _tasks[index].description;
      selectedDeadline = _tasks[index].deadline;
    }

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(index == null ? 'Add Task' : 'Edit Task'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () async {
                final pickedDate = await showDatePicker(
                  context: context,
                  initialDate: selectedDeadline ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime(2101),
                );
                if (pickedDate != null) {
                  final pickedTime = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.now(),
                  );
                  if (pickedTime != null) {
                    setState(() {
                      selectedDeadline = DateTime(
                        pickedDate.year,
                        pickedDate.month,
                        pickedDate.day,
                        pickedTime.hour,
                        pickedTime.minute,
                      );
                    });
                  }
                }
              },
              child: Text(selectedDeadline == null
                  ? 'Pick Deadline'
                  : selectedDeadline.toString()),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty &&
                  descriptionController.text.isNotEmpty) {
                final newTask = Task(
                  title: titleController.text,
                  description: descriptionController.text,
                  deadline: selectedDeadline,
                  status: index == null ? 'Ongoing' : _tasks[index].status,
                );

                setState(() {
                  if (index == null) {
                    _tasks.add(newTask);
                  } else {
                    _tasks[index] = newTask;
                  }
                });

                await _sendTaskToBackend(newTask);
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Tasks'),
            Text(
              'Completed: $completedTasks | Ongoing: $ongoingTasks | Not Completed: $notCompletedTasks',
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
      body: ListView.builder(
        itemCount: _tasks.length,
        itemBuilder: (context, index) {
          final task = _tasks[index];
          return Card(
            color: _getStatusColor(task.status),
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text(task.title),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.description),
                  if (task.deadline != null)
                    Text('Deadline: ${task.deadline}'),
                ],
              ),
              trailing: Wrap(
                children: [
                  IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: () => _changeStatus(index)),
                  IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () => _showTaskDialog(index: index)),
                  IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () => _deleteTask(index)),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTaskDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }
}
