import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WidgetsMockComponent } from "./components/widgets-mock/widgets-mock.component";

const routes: Routes = [
  { path: '', component: WidgetsMockComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WidgetsMockRoutingModule { }
