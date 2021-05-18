/** Use this function to close a ws connection properly */ export function closeWS(
  ws,
  code,
  reason,
) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.close(code, reason);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL21haW4vc3JjL3dzL2Nsb3NlX3dzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogVXNlIHRoaXMgZnVuY3Rpb24gdG8gY2xvc2UgYSB3cyBjb25uZWN0aW9uIHByb3Blcmx5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VXUyh3czogV2ViU29ja2V0LCBjb2RlPzogbnVtYmVyLCByZWFzb24/OiBzdHJpbmcpIHtcbiAgaWYgKHdzLnJlYWR5U3RhdGUgIT09IFdlYlNvY2tldC5PUEVOKSByZXR1cm47XG5cbiAgd3MuY2xvc2UoY29kZSwgcmVhc29uKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRCxBQUExRCxzREFBMEQsQUFBMUQsRUFBMEQsaUJBQzFDLE9BQU8sQ0FBQyxFQUFhLEVBQUUsSUFBYSxFQUFFLE1BQWU7UUFDL0QsRUFBRSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsSUFBSTtJQUVwQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNIn0=
