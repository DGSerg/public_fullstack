import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PositionsService} from "../../../shared/services/positions.service";
import {MaterialInstance, MaterialService} from "../../../shared/classes/material.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Position} from "../../../shared/interfaces";

@Component({
  selector: 'app-positions-form',
  templateUrl: './positions-form.component.html',
  styleUrls: ['./positions-form.component.css']
})
export class PositionsFormComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input('categoryId') categoryId: string;
  @ViewChild('modal', {static: true}) modelRef: ElementRef;
  positions: Position[] = [];
  loading = false;
  positionId = null;
  modal: MaterialInstance;
  form: FormGroup;
  constructor(private positionService: PositionsService) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      cost: new FormControl(null, [Validators.required, Validators.min(1)])

    });


    this.loading = true;
    this.positionService.fetch(this.categoryId).subscribe(positions => {
      this.positions = positions;

      this.loading = false;
    })
  }
  ngOnDestroy(): void {
    this.modal.destroy();
  }

  ngAfterViewInit(): void {
   this.modal = MaterialService.initModal(this.modelRef);
  }


  onSelectPosition(position: Position){
    this.positionId = position._id;
    this.form.patchValue({
      name: position.name,
      cost: position.cost
    });

    this.modal.open();
    MaterialService.updateTextInputs();
  }
  onAddPosition(){
    this.positionId = null;
    this.form.reset({
      name: '',
      cost: ''
    });

    this.modal.open();
    MaterialService.updateTextInputs();
  }
  onDeletePosition(event: Event, position: Position){
    event.stopPropagation();
    const decision = window.confirm(`Удалить позицию "${position.name}"?`);
  
    if (decision){
      this.positionService.delete(position).subscribe(
        response => {
          const idx = this.positions.findIndex(p => p._id === position._id);
          this.positions.splice(idx, 1);
          MaterialService.toast(response.message);
        },
        error => MaterialService.toast(error.error.message)
      );
    }
  }
  onCancel(){
    this.modal.close();
  }
  onSubmit (){
    this.form.disable();
    const newPosition: Position = {
      name: this.form.value.name,
      cost: this.form.value.cost,
      category: this.categoryId
    };

    const complete = () => { // что бы убрать контекст который используется при function
      this.modal.close();
      this.form.reset({name: '', cost: ''});
      this.form.enable();
    };

    if (this.positionId){
      newPosition._id = this.positionId;
      this.positionService.update(newPosition).subscribe(
        position=> {
          const idx = this.positions.findIndex(p=> p._id === position._id);
          this.positions[idx] = position;
          MaterialService.toast('Изменение сохранено');
        },
        error => {
          this.form.enable();
          MaterialService.toast(error.error.message)
        },
        complete
      )
    } else {
      this.positionService.create(newPosition).subscribe(
        position=> {
          MaterialService.toast('Позиция создана');
          this.positions.push(position);
        },
        error => {
          this.form.enable();
          MaterialService.toast(error.error.message)
        },
        complete
      )
    }


  }
}
