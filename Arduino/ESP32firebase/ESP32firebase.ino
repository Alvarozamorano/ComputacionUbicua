#include <FirebaseESP32.h>
#include <WiFi.h>  
#include <NTPClient.h>
//#include <WiFiUdp.h>  
#include <Servo.h>
#include <WifiLocation.h>
#include <stdlib.h>
#include "HX711.h"
#define DEBUG_HX711

//Id y key de la base de datos firebase
#define FIREBASE_HOST "trashqube-ac2ef.firebaseio.com"  // nombre de proyecto
#define FIREBASE_AUTH "owdrpVcMeQJUlJnhXzsDJQNSVvB9ISshYrS1e52p" //key

//Nombre y contraseña wifi
#define WIFI_SSID "MOVISTAR_6C3C"  // Nombre
#define WIFI_PASSWORD "4mT8QRcNFfqXtsxm43Z2"   //password 

//Api key de google para obtener la geolocalización
const char* googleApiKey = "AIzaSyA15VWeoqyjkNyLR5o4FRpcUh7AKr3CTDA";
WifiLocation location(googleApiKey);

//Objeto de datos de Firebase
FirebaseData firebaseData;

//Objeto que implementa las funciones del servomotor
Servo servoMotor;

//Objeto HX711
HX711 bascula;
 
//Cliente NTP que obtiene la fecha
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

//Parámetro para calibrar el peso y el sensor HX711
#define CALIBRACION 58000.0

//Pines de sensores
const int EchoPinAbrir = 18;
const int TriggerPinAbrir = 19;
const int EchoPinFondo = 4;
const int TriggerPinFondo = 5;  
const int pinServo = 23; 
byte pinData = 2;
byte pinClk = 15;

//Variable global que guarda el número de historicos de firebase
int numHistoricos;

//Variable global que guarda las coordenadas 
double latitud,longitud;                                

//Inicialización
void setup() {

  Serial.begin(9600);

  //Se inicializa la conexión Wifi
  inicializarWifi();

  //Se inicializa la base de datos firebase
  inicializarFirebase();

  //Se configura el cliente NTP para obtener la fecha
  configurarTiempo();

  //Se configura los pines de los sensores
  inicializarSensores();

  escribirUbicacion();
}

void loop() {
  //Se obtiene la distancia del sensor de abertura
  int distanciaAbrir = calcularDistancia(TriggerPinAbrir,EchoPinAbrir);
  Serial.println("Distancia abertura: ");
  Serial.println(distanciaAbrir);

  //Si la distancia es menor que 30 cm, se mueve el servo, se obtiene
  //la distancia al fondo y el peso y se envía a firebase
  if(distanciaAbrir<30){
    moverServo();
    delay(4000);
    double distanciaFondo = calcularDistancia(TriggerPinFondo,EchoPinFondo);
    double peso = calculaPeso();
    escribirHistorico(peso,distanciaFondo);
    Serial.println("Distancia Fondo: ");
    Serial.println(distanciaFondo);
    Serial.println("Peso: ");
    Serial.println(peso);
  }
  delay(5000);
}

//Establece conexión wifi 
void inicializarWifi(){  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
  }
  Serial.println("Wifi Conectado"); 
}

//Inicializa el cliente NTP para obtener la fecha posteriormente
void configurarTiempo(){
  timeClient.begin();
  timeClient.setTimeOffset(3600);
  Serial.println("Tiempo config");
}

//Establece conexión con la base de datos de firebase y obtiene 
//el número de históricos
void inicializarFirebase(){
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);   
  Firebase.reconnectWiFi(true); 
  Serial.println("Firebase conectado");
  if (Firebase.getInt(firebaseData, "/numHistoricos/numero")) {
    if (firebaseData.dataType() == "int") {
      Serial.println(firebaseData.intData());    
      numHistoricos = firebaseData.intData(); 
    }
  }
  
}

//Configura los pines de los sensores
void inicializarSensores(){
  pinMode(TriggerPinAbrir, OUTPUT);
  pinMode(EchoPinAbrir, INPUT);
  pinMode(TriggerPinFondo, OUTPUT);
  pinMode(EchoPinFondo, INPUT);
  servoMotor.attach(pinServo);  
  bascula.begin(pinData, pinClk);
  // Se aplica la calibración
  bascula.set_scale(CALIBRACION);
  // Se inicia la tara
  // No tiene que haber nada sobre el peso
  bascula.tare(20);
  Serial.println("Sensores inic");
}

//Obtiene la latitud y longitud de la ESP32
void escribirUbicacion(){
  location_t loc = location.getGeoFromWiFi();
  latitud = loc.lat;
  longitud = loc.lon;
  Serial.println("Ubicacion escrita");
}

//Devuelve la fecha actual 
String devolverTiempoActual(){
  while(!timeClient.update()) {
    timeClient.forceUpdate();
  }
  String formattedDate = timeClient.getFormattedDate();
  int splitT = formattedDate.indexOf("T");
  String dayStamp = formattedDate.substring(0, splitT);
  return dayStamp;
}

//Devuelve la hora actual
String devolverHoraActual(){
  while(!timeClient.update()) {
    timeClient.forceUpdate();
  }
  String formattedDate = timeClient.getFormattedDate();
  int splitT = formattedDate.indexOf("T");
  String timeStamp = formattedDate.substring(splitT+1, formattedDate.length()-1);
  return timeStamp;
}

//Escribe el peso, la distancia al fondo, el día, la hora y la latitud 
//y longitud de la ESP32 en la base de datos de firebase.
void escribirHistorico(double peso,double distanciaFondo){
  long numero = numHistoricos+1; 
  numHistoricos = numero;
  String diaActual = devolverTiempoActual();
  String horaActual = devolverHoraActual();
  //Si la distancia es mayor que 30 existe un pequeño error
  //por lo que se escribe 30
  if(distanciaFondo>30){
    distanciaFondo = 30;
  }
  //Si el peso es menor que 0 existe un pequeño error
  //por lo que se escribe 0
  if(peso<0){
    peso = 0;
  }
  Firebase.setString(firebaseData,"/historicos/" + String(numero) + "/dia",diaActual);
  Firebase.setString(firebaseData,"/historicos/" + String(numero) + "/hora",horaActual);
  Firebase.setDouble(firebaseData,"/historicos/" + String(numero) + "/peso",peso);
  Firebase.setDouble(firebaseData,"/historicos/" + String(numero) + "/distanciaFondo",distanciaFondo/100);
  Firebase.setDouble(firebaseData,"/historicos/" + String(numero) + "/longitud",longitud);
  Firebase.setDouble(firebaseData,"/historicos/" + String(numero) + "/latitud",latitud);
  Firebase.setInt(firebaseData,"/numHistoricos/numero",numero);
}

//Calcula y devuelve la distancia del sensor de distancia
double calcularDistancia(int TriggerPin, int EchoPin){
   long duration, distanceCm;
   
   digitalWrite(TriggerPin, LOW);  //Para generar un pulso limpio ponemos a LOW 4us
   delayMicroseconds(4);
   digitalWrite(TriggerPin, HIGH);  //Se genera Trigger (disparo) de 10us
   delayMicroseconds(10);
   digitalWrite(TriggerPin, LOW);
   
   duration = pulseIn(EchoPin, HIGH);  //Se mide el tiempo entre pulsos, en microsegundos
   
   distanceCm = duration * 10 / 292/ 2;   //Se convierte a distancia, en cm
   return distanceCm;
}

//Mueve el servo desde los 50 grados hasta los 180
void moverServo(){
  servoMotor.write(50);//Posición de tapa abierta
  delay(5000);
  for (int i = 50; i <= 180; i++) {//Se cierra el cubo de forma más lenta
    servoMotor.write(i);
    delay(10);
  }
}

//Calcula y devuelve el peso
double calculaPeso(){
  double peso = bascula.get_units();
  return peso;
}
