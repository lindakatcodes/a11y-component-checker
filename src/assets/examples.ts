export const EXAMPLES = {
  vue: `
    <template>
    <div class="modal">
      <div class="header" @click="close">
        <span>×</span>
      </div>
      <div class="content" style="color: #999; background: #ddd;">
        <input type="text" placeholder="Enter name">
        <button @click="submit">Submit</button>
      </div>
    </div>
    </template>

    <script setup>
    const close = () => { /* close modal */ }
    const submit = () => { /* submit form */ }
    <\/script>
  `,
  react: `
  export default function Modal({ onClose, onSubmit }) {
    return (
      <div className="modal">
        <div className="header" onClick={onClose}>
          <span>×</span>
        </div>
        <div className="content" style={{ color: '#999', background: '#ddd' }}>
          <input type="text" placeholder="Enter name" />
          <button onClick={onSubmit}>Submit</button>
        </div>
      </div>
    );
  }
  `,
  angular: `
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-modal',
      template: \`
        <div class="modal">
          <div class="header" (click)="close()">
            <span>×</span>
          </div>
          <div class="content" style="color: #999; background: #ddd;">
            <input type="text" placeholder="Enter name">
            <button (click)="submit()">Submit</button>
          </div>
        </div>
      \`
    })
    export class ModalComponent {
      close() { /* close modal */ }
      submit() { /* submit form */ }
    }
  `,
}
