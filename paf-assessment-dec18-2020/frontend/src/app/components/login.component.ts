import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { User } from '../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form:FormGroup;
  errorMessage = '';
  validUser;

	constructor(private fb: FormBuilder, private aut: AuthenticationService,private router:Router) { }

	ngOnInit(): void {
    
    this.form = this.fb.group({
      username: this.fb.control("",Validators.required),
      password:this.fb.control("",Validators.required),
    })

  }

  processForm(){
    console.log('here')
    let username = this.form.get('username').value
    let password = this.form.get('password').value
    this.aut.checkuser({username,password} as User)
    .then(r=>
     { console.log(r);
      this.aut.validuser(username,password)
      this.router.navigate(['main']);
      
      
     })
    .catch(e=> {
      console.log(e)
      this.errorMessage=e.error['message']
    })
   }
  
    // username: this.form.get
   
}
