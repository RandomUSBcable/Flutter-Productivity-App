// lib/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart' as jwt;

class ApiService {
  static const String baseUrl = 'http://localhost:1235';

  /// Logs in the user and returns a JWT token.
  static Future<String> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print(data);
      return data['token'];
    } else {
      throw Exception('Failed to login. Check your credentials.');
    }
  }

  /// Registers a new user and returns a JWT token
  static Future<String> register(String email, String password, String confirmPassword) async {
    final url = Uri.parse('$baseUrl/register');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
      }),
    );

    if (response.statusCode == 201) {
      // Expect the response to include a token.
      final data = jsonDecode(response.body);
      final token = data['token'];
      Map<String, dynamic> decodedToken = jwt.JwtDecoder.decode(token);

      String userId = decodedToken['userId']; // adjust based on your payload keys
      String email = decodedToken['email'];   // optional
      // DateTime expiryDate = JwtDecoder.getExpirationDate(token);
      // bool isExpired = JwtDecoder.isExpired(token);

      print(decodedToken);
      return data['token'];
    } else {
      throw Exception('Failed to register user. ${response.body}');
    }
  }

  /// Retrieves tasks for the authenticated user.
  static Future<List<dynamic>> fetchTasks(String token) async {
    // This example assumes your API returns a list of tasks directly.
    final url = Uri.parse('$baseUrl/users'); // Or change to the appropriate endpoint.
    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
    });

    if (response.statusCode == 200) {
      // Adjust the extraction logic based on your backend response shape.
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch tasks');
    }
  }

  /// Creates a new task with the provided details.
  static Future<void> createTask(
      String token, String title, String description) async {
    final url = Uri.parse('$baseUrl/tasks');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'description': description,
        'status': 'TODO',
        'userIds': [] // Adjust to assign users as needed.
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to create task');
    }
  }
}
