import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:collection/collection.dart';
import 'package:http/http.dart' as http;

class Task {
  String title;
  String status;
  String description;
  DateTime? deadline;
  String? assignedTo;

  Task({
    required this.title,
    this.status = 'ONGOING',
    required this.description,
    this.deadline,
    this.assignedTo,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      title: json['title'],
      status: json['status'],
      description: json['description'],
      deadline:
          json['deadline'] != null ? DateTime.parse(json['deadline']) : null,
      assignedTo: json['assignedTo'],
    );
  }
}

class AdminScreen extends StatefulWidget {
  final String token;
  const AdminScreen({super.key, required this.token});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final List<Task> _tasks = [];
  bool _isLoading = false;
  List<String> _users = [];
  List<Task> _filteredTasks = [];
  String _filterStatus = 'ALL';
  String _sortOption = 'NONE';
  bool _isAscending = true;
  String? _selectedUser;

  @override
  void initState() {
    super.initState();
    _fetchTasks();
    _fetchUsers();
  }

  Future<void> _fetchTasks() async {
    setState(() {
      _isLoading = true;
    });

    final url = Uri.parse('http://localhost:1235/admin/tasks');

    try {
      final response = await http.get(url, headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> tasksJson = data['tasks'];
        setState(() {
          _tasks.clear(); // Clear the existing tasks
          _tasks.addAll(
              tasksJson.map((json) => Task.fromJson(json))); // Add new tasks
          _applyFiltersAndSorting();
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

  Future<void> _fetchUsers() async {
    final url = Uri.parse('http://localhost:1235/admin/users');
    try {
      final response = await http.get(url, headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${widget.token}',
      });
      if (response.statusCode == 200) {
        final List<dynamic> usersJson = jsonDecode(response.body)['users'];
        setState(() {
          _users = usersJson.map((user) => user['email'] as String).toList();
        });
      } else {
        debugPrint('Failed to fetch users: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching users: $e');
    }
  }

  void _applyFiltersAndSorting() {
    List<Task> filtered = List.from(_tasks);

    // Apply status filter
    if (_filterStatus != 'ALL') {
      filtered =
          filtered.where((task) => task.status == _filterStatus).toList();
    }

    // Apply sorting
    if (_sortOption == 'TITLE') {
      filtered.sort((a, b) => _isAscending
          ? a.title.compareTo(b.title)
          : b.title.compareTo(a.title));
    } else if (_sortOption == 'DEADLINE') {
      filtered.sort((a, b) {
        if (a.deadline == null && b.deadline == null) return 0;
        if (a.deadline == null) return _isAscending ? 1 : -1;
        if (b.deadline == null) return _isAscending ? -1 : 1;
        return _isAscending
            ? a.deadline!.compareTo(b.deadline!)
            : b.deadline!.compareTo(a.deadline!);
      });
    }

    setState(() {
      _filteredTasks = filtered;
    });
  }

  void _deleteTask(int index) {
    final taskToDelete = _filteredTasks[index];
    final taskIndexInOriginalList = _tasks.indexOf(taskToDelete);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: const Text('Are you sure you want to delete this task?'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _tasks.removeAt(taskIndexInOriginalList);
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

  void _changeStatus(int index) async {
    final taskToUpdate = _filteredTasks[index];
    final taskIndexInOriginalList = _tasks.indexOf(taskToUpdate);
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
                      _tasks[taskIndexInOriginalList].status = status;
                    });
                    _applyFiltersAndSorting();
                    Navigator.pop(context);
                  },
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  Future<void> _sendTaskToBackend(Task task, {bool isNewTask = true}) async {
    final url = Uri.parse('http://localhost:1235/admin/tasks');
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
        'assignedTo': task.assignedTo,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      if (isNewTask) {
        debugPrint('Task created successfully');
      } else {
        debugPrint('Task updated successfully');
      }
    } else {
      debugPrint('Failed to save/update task: ${response.statusCode}');
    }
  }

  Future<void> _updateTask(Task task) async {
    final url = Uri.parse('http://localhost:1235/admin/tasks');
    final response = await http.put(
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
        'assignedTo': task.assignedTo,
      }),
    );

    if (response.statusCode == 200) {
      debugPrint('Task updated successfully');
    } else {
      debugPrint('Failed to update task: ${response.statusCode}');
    }
  }

  void _showTaskDialog({int? index, Task? task}) {
    final TextEditingController titleController = TextEditingController();
    final TextEditingController descriptionController = TextEditingController();
    String? selectedUser = _selectedUser;
    DateTime? selectedDeadline;

    if (index != null) {
      titleController.text = _tasks[index].title;
      descriptionController.text = _tasks[index].description;
      selectedDeadline = _tasks[index].deadline;
      selectedUser = _tasks[index].assignedTo;
    } else if (task != null) {
      titleController.text = task.title;
      descriptionController.text = task.description;
      selectedDeadline = task.deadline;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(index == null ? 'Add Task' : 'Edit Task'),
        content: SingleChildScrollView(
          child: Column(
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
                    ); // Use pickedTime
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
              DropdownButtonFormField<String>(
                value: selectedUser,
                onChanged: (newValue) {
                  setState(() {
                    selectedUser = newValue;
                  });
                },
                items: _users.map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                decoration: const InputDecoration(labelText: 'Assign To'),
              ),
            ],
          ),
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
                  status: index == null ? 'ONGOING' : _tasks[index].status,
                  assignedTo: selectedUser,
                );

                setState(() {
                  if (index == null && task == null) {
                    _tasks.add(newTask);
                  } else if (index != null) {
                    final taskToUpdate = _filteredTasks[index];
                    final taskIndexInOriginalList =
                        _tasks.indexOf(taskToUpdate);
                    _tasks[taskIndexInOriginalList] = newTask;
                  }
                });
                if (index != null) {
                  await _updateTask(newTask);
                }
                _applyFiltersAndSorting();
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
        title: const Text('Admin Panel'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (String value) {
              setState(() {
                _sortOption = value;
                _applyFiltersAndSorting();
              });
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'NONE',
                child: Text('No Sorting'),
              ),
              const PopupMenuItem<String>(
                value: 'TITLE',
                child: Text('Sort by Title'),
              ),
              const PopupMenuItem<String>(
                value: 'DEADLINE',
                child: Text('Sort by Deadline'),
              ),
            ],
          ),
          IconButton(
            icon:
                Icon(_isAscending ? Icons.arrow_upward : Icons.arrow_downward),
            onPressed: () {
              setState(() {
                _isAscending = !_isAscending;
                _applyFiltersAndSorting();
              });
            },
          ),
          PopupMenuButton<String>(
            onSelected: (String value) {
              setState(() {
                _filterStatus = value;
                _applyFiltersAndSorting();
              });
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'ALL',
                child: Text('All'),
              ),
              const PopupMenuItem<String>(
                value: 'COMPLETED',
                child: Text('Completed'),
              ),
              const PopupMenuItem<String>(
                value: 'ONGOING',
                child: Text('Ongoing'),
              ),
              const PopupMenuItem<String>(
                value: 'TODO',
                child: Text('Todo'),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _filteredTasks.length,
              itemBuilder: (context, index) {
                final task = _filteredTasks[index];
                return Card(
                  margin: const EdgeInsets.all(8),
                  child: ListTile(
                    title: Text(task.title),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(task.description),
                        if (task.deadline != null)
                          Text("Deadline: ${task.deadline}"),
                        if (task.assignedTo != null)
                          Text("Assigned to: ${task.assignedTo}"),
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
