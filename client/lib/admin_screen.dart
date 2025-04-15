import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
// import 'package:collection/collection.dart'; // Not strictly needed now
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart'; // For date formatting

// --- Models ---
class Task {
  final int id; // Added ID
  String title;
  String status;
  String description;
  DateTime? deadline;
  // Removed assignedTo - handled via userId during creation/assignment API call
  // We'll fetch assigned user info separately if needed for display later

  Task({
    required this.id, // Added ID
    required this.title,
    this.status = 'ONGOING',
    required this.description,
    this.deadline,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'], // Parse ID
      title: json['title'] ?? 'No Title', // Add null checks/defaults
      status: json['status'] ?? 'ONGOING',
      description: json['description'] ?? 'No Description',
      deadline: json['deadline'] != null
          ? DateTime.tryParse(json['deadline'])
          : null, // Use tryParse
    );
  }

  // Method to create a Map for JSON encoding, excluding ID for creation
  Map<String, dynamic> toJsonForCreate(int? userId) => {
        'title': title,
        'description': description,
        'status': status,
        'deadline': deadline?.toIso8601String(),
        'userId': userId, // Include userId for creation/assignment
      };

  // Method to create a Map for JSON encoding for updates (includes taskId)
  Map<String, dynamic> toJsonForUpdate() => {
        'taskId': id, // Include taskId for update/delete
        'title': title,
        'description': description,
        'status': status,
        'deadline': deadline?.toIso8601String(),
        // Assignment is not updated via this PUT endpoint per original spec
      };
}

class User {
  final int id;
  final String email;

  User({required this.id, required this.email});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'] ?? 'No Email',
    );
  }
}

// --- Service/Helper for API Calls (Optional but Recommended) ---
// You could extract API calls into a separate class for better organization

class AdminScreen extends StatefulWidget {
  final String token;
  const AdminScreen({super.key, required this.token});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  List<Task> _tasks = []; // All tasks fetched
  List<Task> _filteredTasks = []; // Tasks currently displayed after filter/sort
  List<User> _users = []; // List of users with IDs and emails
  Map<int, String> _userMap = {}; // Map ID to Email for easy lookup

  bool _isLoadingTasks = false;
  bool _isLoadingUsers = false;
  String _filterStatus = 'ALL';
  String _sortOption = 'NONE';
  bool _isAscending = true;
  // Removed _selectedUser string, will use selectedUserId (int?) in dialog

  // Base URL for your API
  final String _baseUrl = 'http://localhost:1235'; // Use your actual base URL

  @override
  void initState() {
    super.initState();
    _fetchTasks();
    _fetchUsers();
  }

  // --- Data Fetching ---

  Future<void> _fetchTasks() async {
    setState(() {
      _isLoadingTasks = true;
    });
    final url = Uri.parse('$_baseUrl/tasks/admin/tasks'); // Use base URL

    try {
      final response = await http.get(url, headers: _authHeaders);

      if (!mounted) return; // Check if widget is still in the tree

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> tasksJson = data['tasks'] ?? []; // Handle null case
        setState(() {
          _tasks = tasksJson.map((json) => Task.fromJson(json)).toList();
          _applyFiltersAndSorting(); // Apply current filters/sort to new data
        });
      } else {
        _showErrorSnackbar('Failed to fetch tasks: ${response.statusCode}');
        debugPrint('Failed to fetch tasks: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackbar('Error fetching tasks: $e');
      debugPrint('Error fetching tasks: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingTasks = false;
        });
      }
    }
  }

  Future<void> _fetchUsers() async {
    setState(() {
      _isLoadingUsers = true;
    });
    final url = Uri.parse('$_baseUrl/tasks/admin/users'); // Use base URL

    try {
      final response = await http.get(url, headers: _authHeaders);

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> usersJson = data['users'] ?? []; // Handle null case
        setState(() {
          _users = usersJson.map((json) => User.fromJson(json)).toList();
          _userMap = {for (var user in _users) user.id: user.email};
        });
      } else {
        _showErrorSnackbar('Failed to fetch users: ${response.statusCode}');
        debugPrint('Failed to fetch users: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackbar('Error fetching users: $e');
      debugPrint('Error fetching users: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingUsers = false;
        });
      }
    }
  }

  // --- UI State Management ---

  void _applyFiltersAndSorting() {
    List<Task> filtered = List.from(_tasks);

    // Apply status filter
    if (_filterStatus != 'ALL') {
      filtered =
          filtered.where((task) => task.status == _filterStatus).toList();
    }

    // Apply sorting
    switch (_sortOption) {
      case 'TITLE':
        filtered.sort((a, b) => _isAscending
            ? a.title
                .toLowerCase()
                .compareTo(b.title.toLowerCase()) // Case-insensitive sort
            : b.title.toLowerCase().compareTo(a.title.toLowerCase()));
        break;
      case 'DEADLINE':
        filtered.sort((a, b) {
          if (a.deadline == null && b.deadline == null) return 0;
          if (a.deadline == null)
            return _isAscending ? 1 : -1; // Nulls last when ascending
          if (b.deadline == null)
            return _isAscending ? -1 : 1; // Nulls first when descending
          return _isAscending
              ? a.deadline!.compareTo(b.deadline!)
              : b.deadline!.compareTo(a.deadline!);
        });
        break;
      case 'NONE':
      default:
        // Optionally sort by ID or another default if 'NONE' isn't desired
        // filtered.sort((a, b) => a.id.compareTo(b.id));
        break;
    }

    setState(() {
      _filteredTasks = filtered;
    });
  }

  // --- CRUD Operations ---

  Future<void> _createTask(Task task, int? userId) async {
    final url = Uri.parse('$_baseUrl/tasks/admin/tasks'); // POST endpoint

    setState(() {
      _isLoadingTasks = true;
    }); // Indicate loading

    try {
      final response = await http.post(
        url,
        headers: _authHeaders,
        body: jsonEncode(
            task.toJsonForCreate(userId)), // Use specific toJson method
      );

      if (!mounted) return;

      if (response.statusCode == 201) {
        // Check for 201 Created
        _showSuccessSnackbar('Task created successfully');
        // Fetch tasks again to get the new task with its ID from the backend
        await _fetchTasks();
      } else {
        _showErrorSnackbar('Failed to create task: ${response.statusCode}');
        debugPrint('Failed to create task: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackbar('Error creating task: $e');
      debugPrint('Error creating task: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingTasks = false;
        });
      }
    }
  }

  Future<void> _updateTask(Task task) async {
    final url = Uri.parse('$_baseUrl/tasks/admin/tasks'); // PUT endpoint

    // Optimistic UI update (optional, makes UI feel faster)
    final originalTaskIndex = _tasks.indexWhere((t) => t.id == task.id);
    Task? originalTask;
    if (originalTaskIndex != -1) {
      originalTask =
          _tasks[originalTaskIndex]; // Store original for potential rollback
      setState(() {
        _tasks[originalTaskIndex] = task; // Update local list immediately
        _applyFiltersAndSorting();
      });
    }

    try {
      final response = await http.put(
        url,
        headers: _authHeaders,
        body: jsonEncode(task.toJsonForUpdate()), // Use specific toJson method
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        _showSuccessSnackbar('Task updated successfully');
        // No need to re-fetch if optimistic update was done, unless backend modifies data
      } else {
        _showErrorSnackbar('Failed to update task: ${response.statusCode}');
        debugPrint('Failed to update task: ${response.body}');
        // Rollback optimistic update on failure
        if (originalTask != null && originalTaskIndex != -1) {
          setState(() {
            _tasks[originalTaskIndex] = originalTask!;
            _applyFiltersAndSorting();
          });
        }
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackbar('Error updating task: $e');
      debugPrint('Error updating task: $e');
      // Rollback optimistic update on failure
      if (originalTask != null && originalTaskIndex != -1) {
        setState(() {
          _tasks[originalTaskIndex] = originalTask!;
          _applyFiltersAndSorting();
        });
      }
    }
  }

  Future<void> _deleteTaskApi(int taskId) async {
    final url = Uri.parse('$_baseUrl/tasks/admin/tasks'); // DELETE endpoint

    try {
      final response = await http.delete(
        url,
        headers: _authHeaders,
        body: jsonEncode({'taskId': taskId}), // Send taskId in body
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 204) {
        // Handle 200 or 204 No Content
        _showSuccessSnackbar('Task deleted successfully');
        // Update local state *after* successful deletion
        setState(() {
          _tasks.removeWhere((task) => task.id == taskId);
          _applyFiltersAndSorting();
        });
      } else {
        _showErrorSnackbar('Failed to delete task: ${response.statusCode}');
        debugPrint('Failed to delete task: ${response.body}');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorSnackbar('Error deleting task: $e');
      debugPrint('Error deleting task: $e');
    }
  }

  // --- UI Event Handlers ---

  void _confirmAndDeleteTask(Task task) {
    // Find the task in the filtered list to get its index if needed, but use ID for API call
    // final taskToDelete = _filteredTasks[index];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Are you sure you want to delete "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context), // Close dialog
            child: const Text('NO'),
          ),
          TextButton(
            // Make button red for destructive action
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(context); // Close dialog first
              await _deleteTaskApi(task.id); // Call API with task ID
            },
            child: const Text('YES, DELETE'),
          ),
        ],
      ),
    );
  }

  void _showChangeStatusDialog(Task task) async {
    // Find the task in the main list to update it directly by reference
    final taskIndexInOriginalList = _tasks.indexWhere((t) => t.id == task.id);
    if (taskIndexInOriginalList == -1) return; // Should not happen

    final currentStatus = _tasks[taskIndexInOriginalList].status;

    final String? newStatus = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Task Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['COMPLETED', 'ONGOING', 'TODO']
              .map(
                (status) => ListTile(
                  title: Text(status),
                  leading: Radio<String>(
                    value: status,
                    groupValue: currentStatus,
                    onChanged: (String? value) {
                      // Immediately pop with the selected value
                      Navigator.pop(context, value);
                    },
                  ),
                  onTap: () {
                    // Immediately pop with the selected value
                    Navigator.pop(context, status);
                  },
                ),
              )
              .toList(),
        ),
        actions: <Widget>[
          TextButton(
            child: const Text('Cancel'),
            onPressed: () {
              Navigator.of(context).pop(); // Pop without a value
            },
          ),
        ],
      ),
    );

    // If a new status was selected and it's different
    if (newStatus != null && newStatus != currentStatus) {
      // Create a new Task object with the updated status
      final updatedTask = Task(
          id: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          status: newStatus // Set the new status
          );
      // Call the API to update the task
      await _updateTask(updatedTask);
    }
  }

  void _showTaskDialog({Task? taskToEdit}) {
    // Renamed parameter for clarity
    final bool isEditing = taskToEdit != null;
    final TextEditingController titleController =
        TextEditingController(text: isEditing ? taskToEdit.title : '');
    final TextEditingController descriptionController =
        TextEditingController(text: isEditing ? taskToEdit.description : '');

    // State variables specific to the dialog
    DateTime? selectedDeadline = isEditing ? taskToEdit.deadline : null;
    int? selectedUserId; // Store user ID, not email string
    // Pre-select user if editing - requires finding user ID from task, which we don't have directly.
    // For MVP, we won't pre-select the user when editing.
    // If you fetch assigned user ID with tasks later, you can pre-select here.

    showDialog(
      context: context,
      // Use StatefulBuilder to manage dialog's internal state for deadline/user selection
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: Text(isEditing ? 'Edit Task' : 'Add Task'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment:
                    CrossAxisAlignment.start, // Align labels left
                children: [
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'Title'),
                    textCapitalization: TextCapitalization.sentences,
                  ),
                  const SizedBox(height: 16),
                  const Text('Description',
                      style: TextStyle(fontSize: 16)), // Label for description
                  const SizedBox(height: 4),
                  TextField(
                    controller: descriptionController,
                    maxLines: 3,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Enter description...',
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Deadline Picker
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(selectedDeadline == null
                          ? 'No Deadline Set'
                          : 'Deadline: ${DateFormat.yMd().add_jm().format(selectedDeadline!)}'), // Format date/time
                      TextButton(
                        onPressed: () async {
                          final DateTime? pickedDate = await showDatePicker(
                            context: context,
                            initialDate: selectedDeadline ?? DateTime.now(),
                            firstDate: DateTime.now().subtract(const Duration(
                                days:
                                    30)), // Allow past dates? Adjust if needed
                            lastDate: DateTime(2101),
                          );
                          if (pickedDate != null && mounted) {
                            final TimeOfDay? pickedTime = await showTimePicker(
                              context: context,
                              initialTime: TimeOfDay.fromDateTime(
                                  selectedDeadline ?? DateTime.now()),
                            );
                            if (pickedTime != null) {
                              // Use dialog's setState
                              setDialogState(() {
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
                            ? 'Set Deadline'
                            : 'Change'),
                      ),
                    ],
                  ),
                  if (selectedDeadline != null) // Button to clear deadline
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          setDialogState(() {
                            selectedDeadline = null;
                          });
                        },
                        child: const Text('Clear Deadline',
                            style: TextStyle(color: Colors.grey)),
                      ),
                    ),
                  const SizedBox(height: 16),
                  // User Assignment Dropdown
                  if (_users.isNotEmpty) // Only show if users are loaded
                    DropdownButtonFormField<int>(
                      // Use int for user ID
                      value: selectedUserId,
                      hint: const Text('Assign To (Optional)'),
                      isExpanded: true, // Allow dropdown to expand
                      onChanged: (newValue) {
                        setDialogState(() {
                          selectedUserId = newValue;
                        });
                      },
                      items: [
                        // Optional: Add a "None" option explicitly
                        const DropdownMenuItem<int>(
                          value: null, // Represents no user assigned
                          child: Text("None"),
                        ),
                        // Map users to dropdown items
                        ..._users.map<DropdownMenuItem<int>>((User user) {
                          return DropdownMenuItem<int>(
                            value: user.id,
                            child: Text(user.email),
                          );
                        }).toList(),
                      ],
                      decoration: const InputDecoration(labelText: 'Assign To'),
                    )
                  else if (_isLoadingUsers)
                    const Center(
                        child:
                            Text("Loading users...")) // Show loading indicator
                  else
                    const Text(
                        "No users available to assign."), // Handle case where users couldn't be loaded
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () async {
                  final title = titleController.text.trim();
                  final description = descriptionController.text.trim();

                  if (title.isEmpty) {
                    // Optional: Show validation message
                    _showErrorSnackbar("Title cannot be empty.");
                    return;
                  }

                  if (isEditing) {
                    // Update existing task
                    final updatedTask = Task(
                      id: taskToEdit.id, // Use existing ID
                      title: title,
                      description: description,
                      deadline: selectedDeadline,
                      status: taskToEdit
                          .status, // Keep existing status (status change is separate)
                    );
                    Navigator.pop(context); // Close dialog first
                    await _updateTask(updatedTask);
                    // Note: Assignment is NOT updated here per original API spec
                  } else {
                    // Create new task
                    final newTask = Task(
                      id: 0, // Temporary ID, backend will assign real one
                      title: title,
                      description: description,
                      deadline: selectedDeadline,
                      status: 'TODO', // Default status for new tasks
                    );
                    Navigator.pop(context); // Close dialog first
                    await _createTask(
                        newTask, selectedUserId); // Pass selected user ID
                  }
                },
                child: const Text('Save'),
              ),
            ],
          );
        },
      ),
    );
  }

  // --- Helpers ---

  Map<String, String> get _authHeaders => {
        'Content-Type': 'application/json; charset=UTF-8', // Specify charset
        'Authorization': 'Bearer ${widget.token}',
      };

  void _showErrorSnackbar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackbar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  // --- Build Method ---

  @override
  Widget build(BuildContext context) {
    final bool isLoading =
        _isLoadingTasks || _isLoadingUsers; // Combined loading state

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Panel'),
        actions: [
          // Sort Options
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            tooltip: "Sort Tasks",
            initialValue: _sortOption,
            onSelected: (String value) {
              if (_sortOption == value) {
                // If same option selected, toggle direction
                setState(() {
                  _isAscending = !_isAscending;
                });
              } else {
                // If new option selected, default to ascending
                setState(() {
                  _sortOption = value;
                  _isAscending = true;
                });
              }
              _applyFiltersAndSorting();
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                  value: 'NONE', child: Text('Default Order')),
              PopupMenuItem<String>(
                value: 'TITLE',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('By Title'),
                  trailing: _sortOption == 'TITLE'
                      ? Icon(_isAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward)
                      : null,
                ),
              ),
              PopupMenuItem<String>(
                value: 'DEADLINE',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('By Deadline'),
                  trailing: _sortOption == 'DEADLINE'
                      ? Icon(_isAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward)
                      : null,
                ),
              ),
            ],
          ),
          // Filter Options
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            tooltip: "Filter Status",
            initialValue: _filterStatus,
            onSelected: (String value) {
              setState(() {
                _filterStatus = value;
                _applyFiltersAndSorting();
              });
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                  value: 'ALL', child: Text('All Statuses')),
              const PopupMenuItem<String>(
                  value: 'COMPLETED', child: Text('Completed')),
              const PopupMenuItem<String>(
                  value: 'ONGOING', child: Text('Ongoing')),
              const PopupMenuItem<String>(value: 'TODO', child: Text('Todo')),
            ],
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : _filteredTasks.isEmpty
              ? Center(
                  child: Text(_tasks.isEmpty
                      ? "No tasks found."
                      : "No tasks match the current filter."))
              : RefreshIndicator(
                  // Add pull-to-refresh
                  onRefresh: () async {
                    await _fetchTasks();
                    await _fetchUsers(); // Optionally refresh users too
                  },
                  child: ListView.builder(
                    itemCount: _filteredTasks.length,
                    itemBuilder: (context, index) {
                      final task = _filteredTasks[index];
                      // Find assigned user email if possible (requires modification if needed)
                      // String assignedUserEmail = "Unknown"; // Default
                      // if (task.assignedUserId != null && _userMap.containsKey(task.assignedUserId)) {
                      //    assignedUserEmail = _userMap[task.assignedUserId]!;
                      // }

                      return Card(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        elevation: 2,
                        child: ListTile(
                          title: Text(task.title,
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(task.description,
                                  maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Chip(
                                    // Use a chip for status
                                    label: Text(task.status),
                                    padding: EdgeInsets.zero,
                                    labelStyle: const TextStyle(fontSize: 10),
                                    backgroundColor: task.status == 'COMPLETED'
                                        ? Colors.green[100]
                                        : (task.status == 'ONGOING'
                                            ? Colors.orange[100]
                                            : Colors.blue[100]),
                                  ),
                                  const SizedBox(width: 8),
                                  if (task.deadline != null)
                                    Text(
                                        "Due: ${DateFormat.yMd().add_jm().format(task.deadline!)}",
                                        style: const TextStyle(
                                            fontSize: 12, color: Colors.grey)),
                                ],
                              ),

                              // If you fetch assigned user info later, display it here:
                              // if (task.assignedUserId != null)
                              //   Text("Assigned to: $assignedUserEmail", style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.sync_alt,
                                    color:
                                        Colors.blue), // Icon for status change
                                tooltip: "Change Status",
                                onPressed: () => _showChangeStatusDialog(task),
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit,
                                    color: Colors.orange),
                                tooltip: "Edit Task",
                                onPressed: () =>
                                    _showTaskDialog(taskToEdit: task),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete,
                                    color:
                                        Colors.grey), // Keep grey or make red
                                tooltip: "Delete Task",
                                onPressed: () => _confirmAndDeleteTask(task),
                              ),
                            ],
                          ),
                          onTap: () => _showTaskDialog(
                              taskToEdit:
                                  task), // Allow tapping list item to edit
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTaskDialog(), // Call without task to create new
        tooltip: 'Add Task',
        child: const Icon(Icons.add),
      ),
    );
  }
}
