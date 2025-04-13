import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(const Timerpage());
}

class Timerpage extends StatelessWidget {
  const Timerpage({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Myhomepage(),
    );
  }
}

class Myhomepage extends StatefulWidget {
  const Myhomepage({super.key});

  @override
  _MyhomepageState createState() => _MyhomepageState();
}

class _MyhomepageState extends State<Myhomepage> {
  Timer? _timer;
  int _totalDuration = 60;
  int _start = 60; 
  bool _isRunning = false;
  final TextEditingController _controller = TextEditingController(); 

  void startTimer() {
    if (!_isRunning) {
      // Only set new duration if controller has a valid positive number AND timer is at initial state
      int? inputDuration = int.tryParse(_controller.text);
      if (inputDuration != null && inputDuration > 0 && _start == _totalDuration) {
        _start = inputDuration;
        _totalDuration = inputDuration;
      }
      _isRunning = true;

      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_start > 0) {
          setState(() {
            _start--;
          });
        } else {
          timer.cancel();
          _isRunning = false;
          resetTimer();
        }
      });
    }
  }

  void stopTimer() {
    if (_isRunning) {
      _timer?.cancel();
      _isRunning = false;
    }
  }

  void resetTimer() {
    setState(() {
      _start = _totalDuration;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[850],
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 250,
                    height: 250,
                    child: CircularProgressIndicator(
                      value: _start / _totalDuration,
                      backgroundColor: Colors.grey[700],
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.grey),
                      strokeWidth: 12,
                    ),
                  ),
                  Text(
                    '${(_start ~/ 3600).toString().padLeft(2, '0')}:${((_start % 3600) ~/ 60).toString().padLeft(2, '0')}:${(_start % 60).toString().padLeft(2, '0')}',
                    style: const TextStyle(
                      fontSize: 48,
                      color: Colors.orangeAccent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Center(
            child: ElevatedButton(
              onPressed: () async {
                final TimeOfDay? picked = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay(hour: 0, minute: _start ~/ 60),
                  builder: (BuildContext context, Widget? child) {
                    return Theme(
                      data: Theme.of(context).copyWith(
                        timePickerTheme: TimePickerThemeData(
                          hourMinuteTextStyle: const TextStyle(fontSize: 24),
                          hourMinuteColor: Colors.blueGrey[800],
                          dayPeriodTextStyle: const TextStyle(fontSize: 12),
                          dayPeriodColor: Colors.blueGrey[600],
                          dialHandColor: Colors.blueAccent,
                          dialBackgroundColor: Colors.blueGrey[900],
                          hourMinuteTextColor: Colors.white,
                          dayPeriodTextColor: Colors.white,
                          entryModeIconColor: Colors.white,
                        ),
                      ),
                      child: MediaQuery(
                        data: MediaQuery.of(context).copyWith(
                          alwaysUse24HourFormat: true,
                        ),
                        child: child!,
                      ),
                    );
                  },
                );
                if (picked != null) {
                  setState(() {
                    _start = picked.hour * 3600 + picked.minute * 60;
                    _totalDuration = _start;
                    _controller.text = _start.toString();
                  });
                }
              },
              child: const Text('SET TIME', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 144, 141, 141),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: startTimer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  elevation: 12.0,
                  textStyle: const TextStyle(color: Colors.white),
                  padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 20.0),
                  minimumSize: const Size(100, 40),
                ),
                child: const Text('START', style: TextStyle(color: Colors.orange)),
              ),
              ElevatedButton(
                onPressed: stopTimer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  elevation: 12.0,
                  textStyle: const TextStyle(color: Colors.white),
                  padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 20.0),
                  minimumSize: const Size(100, 40),
                ),
                child: const Text('STOP', style: TextStyle(color: Colors.black)),
              ),
              ElevatedButton(
                onPressed: resetTimer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueGrey,
                  elevation: 12.0,
                  textStyle: const TextStyle(color: Colors.white),
                  padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 20.0),
                  minimumSize: const Size(100, 40),
                ),
                child: const Text('RESET', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
