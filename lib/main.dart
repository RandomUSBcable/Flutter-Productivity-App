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
            context, MaterialPageRoute(builder: (context) => const TaskPage()));
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
        return const Color.fromARGB(255, 20, 108, 23);
      case 'Ongoing':
        return const Color.fromARGB(255, 15, 84, 139);
      case 'Not Completed':
        return const Color.fromARGB(255, 163, 26, 26);
      default:
        return Colors.white;
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
            onPressed: () {
              Navigator.pop(context);
            },
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
    final url = Uri.parse('https://example.com/api/tasks'); // Replace with your actual endpoint

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

    if (response.statusCode == 200 || response.statusCode == 201) {
      debugPrint('Task saved successfully');
    } else {
      debugPrint('Failed to save task: ${response.statusCode}');
    }
  }

  void _showTaskDialog({int? index}) {
    final TextEditingController titleController = TextEditingController();
    final TextEditingController descriptionController = TextEditingController();
    DateTime? selectedDeadline;

    if (index != null) {
      titleController.text = _tasks[index].title;
      descriptionController.text = _tasks[index].description;
      selectedDeadline = _tasks[index].deadline;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(index == null ? 'Add Task' : 'Edit Task'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: EdgeInsets.only(top: 8.0, bottom: 4.0),
                child: Text(
                  'Description',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.normal),
                ),
              ),
            ),
            TextField(
              controller: descriptionController,
              maxLength: 500,
              maxLines: 3,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
            ),
            TextButton(
              onPressed: () async {
                DateTime? pickedDate = await showDatePicker(
                  context: context,
                  initialDate: selectedDeadline ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime(2101),
                );
                if (pickedDate != null) {
                  TimeOfDay? pickedTime = await showTimePicker(
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

                if (mounted) {
                  Navigator.pop(context);
                }
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
              title: Text(task.title, style: const TextStyle(fontSize: 18)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(task.description),
                  if (task.deadline != null)
                    Text("Deadline: ${task.deadline}"),
                ],
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () => _changeStatus(index),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => _showTaskDialog(index: index),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Colors.grey),
                    onPressed: () => _deleteTask(index),
                  ),
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
