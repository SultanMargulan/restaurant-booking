import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

const bool kIsEmulator =
    bool.fromEnvironment('IS_EMULATOR', defaultValue: true);

final String _baseDev =
    kIsEmulator ? '10.0.2.2' : '192.168.0.5';   // Update with your Wi-Fi IP
final String _initialUrl = 'http://$_baseDev:3000';  // React runs on 3000

void main() => runApp(const MaterialApp(home: WebViewContainer()));

class WebViewContainer extends StatefulWidget {
  const WebViewContainer({super.key});
  @override
  State<WebViewContainer> createState() => _WebViewContainerState();
}

class _WebViewContainerState extends State<WebViewContainer> {
  late final WebViewController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(_initialUrl));
  }
  
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Site 1 Shell')),
    body: WebViewWidget(controller: _controller),
  );
}
