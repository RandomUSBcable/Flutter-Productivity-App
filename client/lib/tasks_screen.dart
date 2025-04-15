import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

// Define a simple Task model
class Task {
  String title;
  String status;
  String description;
  DateTime? deadline;

  Task({
    required this.title,
    this.status = 'ONGOING',
    required this.description,
    this.deadline,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      title: json['title'],
      status: json['status'],
      description: json['description'],
      deadline: json['deadline'] != null
          ? DateTime.parse(json['deadline'])
          : null,
    );
  }
}

// Update the TaskPage so it requires a JWT token
class TasksScreen extends StatefulWidget {
  final String token;
  const TasksScreen({super.key, required this.token});

  @override
  State<TasksScreen> createState() => _TaskPageState();
}

class _TaskPageState extends State<TasksScreen> {
  final List<Task> _tasks = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchTasks(); // Call immediately
  }

  // Getter properties for summary counts
  int get completedTasks =>
      _tasks.where((task) => task.status == 'COMPLETED').length;
  int get ongoingTasks =>
      _tasks.where((task) => task.status == 'ONGOING').length;
  int get notCompletedTasks =>
      _tasks.where((task) => task.status == 'TODO').length;

  // Map task statuses to colors for UI feedback
  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return const Color.fromARGB(255, 20, 108, 23);
      case 'ONGOING':
        return const Color.fromARGB(255, 15, 84, 139);
      case 'TODO':
        return const Color.fromARGB(255, 163, 26, 26);
      default:
        return Colors.white;
    }
  }

  // Fetch persisted tasks from the backend.
  Future<void> _fetchTasks() async {
    setState(() {
      _isLoading = true;
    });

    final url = Uri.parse('http://localhost:1235/tasks'); // Update if needed

    try {
      final response = await http.get(url, headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}',
      },

      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Assuming the response has the shape: { "tasks": [ { ... } ] }
        final List<dynamic> tasksJson = data['tasks'];
        setState(() {
          _tasks.clear();
          _tasks.addAll(tasksJson.map((json) => Task.fromJson(json)));
        });
      } else {
        debugPrint('Failed to fetch tasks: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching tasks: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Delete a task with confirmation
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

  // Change the status of an existing task
  void _changeStatus(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Task Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['COMPLETED', 'ONGOING', 'TODO']
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

  /// Sends a task to your backend API.
  /// This function includes the token in the headers for authorization.
  Future<void> _sendTaskToBackend(Task task) async {
    final url = Uri.parse('http://localhost:1235/tasks'); // Update if needed
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}',
      },
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

  // Show a dialog to add or edit a task
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
                  style: TextStyle(fontSize: 16),
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
                  status:
                  index == null ? 'ONGOING' : _tasks[index].status,
                );

                setState(() {
                  if (index == null) {
                    _tasks.add(newTask);
                  } else {
                    _tasks[index] = newTask;
                  }
                });

                // Send task information to the backend.
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
              'COMPLETED: $completedTasks | ONGOING: $ongoingTasks | TODO: $notCompletedTasks',
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
              title: Text(
                task.title,
                style: const TextStyle(fontSize: 18),
              ),
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
        onPressed: _showTaskDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
