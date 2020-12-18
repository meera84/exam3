import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import {CameraService} from '../camera.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
	form:FormGroup
	imagePath = '/assets/cactus.png'
	image1;
	imagename;
	gotimage;
	@ViewChild('imagefile') imagefile: ElementRef;
	//Note: my camera is not working. 

	constructor(private cameraSvc: CameraService, private fb: FormBuilder, private http: HttpClient, private aut: AuthenticationService, private router: Router) { }

	ngOnInit(): void {
	  if (this.cameraSvc.hasImage()) {
			const img = this.cameraSvc.getImage()
			console.log(img)
			this.imagePath = img.imageAsDataUrl
			this.image1 = this.cameraSvc.getImage()
		}
		this.form = this.fb.group({
			// 'image-file': this.fb.control("", Validators.required),
			imagefile: this.fb.control(this.image1, Validators.required),
			// img:this.fb.control("", Validators.required),
      title: this.fb.control("",Validators.required),
      comments:this.fb.control("",Validators.required),
		})
		
		

	}

	clear() {
		// this.imagePath = '/assets/cactus.png';
		this.form.reset();
		this.imagePath = '/assets/cactus.png';
	}

		async upload(){
			const a = await this.aut.gotUserData()
			let username = a.username;
			let password = a.password;
			console.log('usernameatupload',username)
			console.log('password',password)
			if (a.username == null || password == null){
				window.alert('user has not logged in yet. cant proceed')
				this.router.navigate(['']);
			}
			else {
			const formData = new FormData();
			formData.set('title', this.form.get('title').value);
			formData.set('comments', this.form.get('comments').value);
			formData.set('image1', this.image1.imageData)
			formData.set('username', username)
			formData.set('password', password)
			console.log(formData.get('image1'))

			const result = await this.aut.uploadImage(formData)
    	.then(r=>
		 { this.clear()
     })
   	 .catch(e=> {
      this.router.navigate(['']);
      
		})
	}

}}
