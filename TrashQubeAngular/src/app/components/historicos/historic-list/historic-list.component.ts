import { Component, OnInit } from '@angular/core';

// Service
import { HistoricoService } from '../../../services/historico.service';

// Class Product
import { Historico } from '../../../models/historico'; 

// Grafica 
import { Chart } from 'chart.js';

@Component({
  selector: 'app-historic-list',
  templateUrl: './historic-list.component.html',
  styleUrls: ['./historic-list.component.css']
})
export class HistoricListComponent implements OnInit {

  // declaracion de variables
  chartHistorico: any = null;
  chartEstado: any = null;

  historicList: Historico[];

  // string para mostrarlos en el html con 2 decimales
  avarageWeight: string;
  avarageDistance: string;
  avaragePercentage: string;

  
  topDistanceF: string; topDistanceS: string; topDistanceT: string;
  topDistanceDF: string; topDistanceDS: string; topDistanceDT: string;

  topWeightF: string; topWeightS: string; topWeightT: string;
  topWeightDF: string; topWeightDS: string; topWeightDT: string;

  globalLat: number = 40.455349;
  globalLng: number = -3.4697299;

  markerLat: number;
  markerLng: number;

  // CONSTRUCTOR
  constructor(private historicoService: HistoricoService) { }

  ngOnInit() {
      this.chartHistorico = new Chart('historicoFondo', {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'Distancia al Fondo',
              backgroundColor: "#3e95cd",
              borderColor: "#3e95cd",
              fill: false,
              //lineTension: 0, //para que no tenga curvatura
              data: [
              ],
            },
            {
              label: 'Peso',
              backgroundColor: "#a903fc",
              borderColor: "#a903fc",
              fill: false,
              data: [
              ],
            }
          ]
          },
          options: {
            responsive: true,
            title: {
              display: true,
              text: 'Datos Históricos de Distancia al Fondo'
            },
            scales: {
              xAxes: [{
                display: true,
						    scaleLabel: {
                  display: true,
                  labelString: 'Fecha'
                }
              }],
              yAxes: [{
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Distancia / Peso'
                }
              }]
            }
          }
        });

      this.chartEstado = new Chart('estadoCubo', {
        type: 'pie',
        data: {
          labels: ["Libre", "Ocupado"],
          datasets: [
          {
              label: "Capacidad (porcentaje)",
              backgroundColor: ["#3ecd76", "#cd3e4e"],
              data: []
          }
          ]
        },
        options: {
          responsive: true,
          title: {
            display: true,
            text: 'Estado Acutal del Cubo'
          },
        },
      });

      this.historicoService.getHistorics()
      .snapshotChanges()
      .subscribe(item => {
        this.historicList = [];
        item.forEach(element => {
          let x = element.payload.toJSON();
          x["$key"] = element.key;
          this.historicList.push(x as Historico);

          
          if(item.indexOf(element)==item.length-1){
            // lines chart
            this.chartHistorico.data.labels = [];
            this.chartHistorico.data.datasets[0].data = [];
            this.chartHistorico.data.datasets[1].data = [];
            this.showHistorico();

            // pie chart
            this.chartEstado.data.datasets[0].data = [];
            this.showEstado();

            // statistics
            this.getAvarageWeight();
            this.getAvarageDistance();
            this.getAvaragePercentage();

            this.getTopWeight();
            this.getTopDistance();
            
            // google maps
            this.getMarker();
          }
        });
      });
  }

  private getMarker(): void{
    this.markerLat = this.historicList[0].latitud;
    this.markerLng = this.historicList[0].longitud;
  }

  private getAvarageWeight(): void{
    var sumatorio = 0;
    for(let i in this.historicList){
      sumatorio = sumatorio+this.historicList[i].peso;
    }
    this.avarageWeight = (sumatorio/this.historicList.length).toFixed(2);
  }

  private getAvarageDistance(): void{
    var sumatorio = 0;
    for(let i in this.historicList){
      sumatorio = sumatorio+this.historicList[i].distanciaFondo;
    }
    this.avarageDistance = (sumatorio/this.historicList.length).toFixed(2);
  }

  private getAvaragePercentage(): void{
    var sumatorio = 0;
    for(let i in this.historicList){
      sumatorio = sumatorio+(this.historicList[this.historicList.length-1].distanciaFondo*100)/0.30;
    }
    this.avaragePercentage = (sumatorio/this.historicList.length).toFixed(2);
  }

  private getTopWeight(): void{
    var first = 0; var second  = 0; var third = 0;
    var DF = ""; var DS = ""; var DT = "";
    if(this.historicList.length >= 3){
      for(let i in this.historicList){
        if(this.historicList[i].peso > first){
          third = second;
          DT = DS;
          second = first;
          DS = DF;
          first =  this.historicList[i].peso;
          DF = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }else if(this.historicList[i].peso > second){
          third = second;
          DT = DS;
          second = this.historicList[i].peso;
          DS = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }else if(this.historicList[i].peso > third){
          third = this.historicList[i].peso;
          DT = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }
      }
      //datos
      this.topWeightF = first.toFixed(2); this.topWeightS = second.toFixed(2); this.topWeightT = third.toFixed(2);
      //fechas
      this.topWeightDF = DF; this.topWeightDS = DS; this.topWeightDT = DT;
    }
  }

  private getTopDistance(): void{
    var first = 0.35; var second  = 0.35; var third = 0.35;
    var DF = ""; var DS = ""; var DT = "";
    if(this.historicList.length >= 3){
      for(let i in this.historicList){
        if(this.historicList[i].distanciaFondo < first){
          third = second;
          DT = DS;
          second = first;
          DS = DF;
          first =  this.historicList[i].distanciaFondo;
          DF = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }else if(this.historicList[i].distanciaFondo < second){
          third = second;
          DT = DS;
          second = this.historicList[i].distanciaFondo;
          DS = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }else if(this.historicList[i].distanciaFondo < third){
          third = this.historicList[i].distanciaFondo;
          DT = this.historicList[i].dia + "/" + this.historicList[i].hora;
        }
      }
      //datos
      this.topDistanceF = first.toFixed(2); this.topDistanceS = second.toFixed(2); this.topDistanceT = third.toFixed(2);
      //fechas
      this.topDistanceDF = DF; this.topDistanceDS = DS; this.topDistanceDT = DT;
    }
  }

	private showHistorico(): void {    
    // metemos los datos en el grafico de lineas
      for(let i in this.historicList){
        if(this.chartHistorico.data.labels.length > 20) {
          this.chartHistorico.data.labels.shift();
          this.chartHistorico.data.datasets[0].data.shift();
          this.chartHistorico.data.datasets[1].data.shift();
        }

        this.chartHistorico.data.labels.push(this.historicList[i].dia+"/"+this.historicList[i].hora);
        this.chartHistorico.data.datasets[0].data.push(this.historicList[i].distanciaFondo);
        this.chartHistorico.data.datasets[1].data.push(this.historicList[i].peso);
    }

    // actualizamos
    this.chartHistorico.update();
  }

  private showEstado(): void {
    // regla de tres
    var porcentaje = (this.historicList[this.historicList.length-1].distanciaFondo*100)/0.30;

    // subimos los datos      
    this.chartEstado.data.datasets[0].data.push(porcentaje);     // Libre
    this.chartEstado.data.datasets[0].data.push(100-porcentaje); // Ocupado

    // actualizamos
    this.chartEstado.update();
  }

  onEdit(historico: Historico){
    this.historicoService.selectedHistorico = Object.assign({}, historico);
  }

  onDelete($key: string){
    this.historicoService.deleteHistorico($key);
  }

}
