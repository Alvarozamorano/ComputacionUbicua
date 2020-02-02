import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

// Service
import { HistoricoService } from '../../../services/historico.service';
import { Historico } from 'src/app/models/historico';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.css']
})
export class HistoricoComponent implements OnInit {

  constructor(
    private historicoService: HistoricoService
    ) { }

  ngOnInit() {
    this.historicoService.getHistorics();
    this.resetForm();
  }

  onSubmit(historicoForm: NgForm){
    if(historicoForm.value.$key == null){
      this.historicoService.insertHistorico(historicoForm.value);
    }else{
      this.historicoService.updateHistorico(historicoForm.value);
    }
    
    this.resetForm(historicoForm);
  }

  resetForm(historicoForm?: NgForm){
    if(historicoForm != null)
      historicoForm.reset();
      this.historicoService.selectedHistorico = new Historico();
  }

}
