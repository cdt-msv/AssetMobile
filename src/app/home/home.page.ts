import { Component,  ViewChild, ElementRef } from '@angular/core';
// import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera';
import { NavController, ActionSheetController, LoadingController } from '@ionic/angular';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { Toast } from '@ionic-native/toast/ngx';
import * as Tesseract from 'tesseract.js';
import { createWorker } from 'tesseract.js';
import { NgProgress } from '@ngx-progressbar/core';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  @ViewChild('inputname', { static: true }) inputname;
  @ViewChild('inputlastname', {static: true}) inputlastname;
  @ViewChild('inputnote', {static: true}) inputnote;
  @ViewChild('cambutton', {static: true}) cambutton;
  @ViewChild('inputhidden', {static: true}) inputhidden;

  selectedImage: string;
  imageText: string;

  waiting: boolean;
  
  username: string = '';
  lastname: string = '';
  note: string = '';

  constructor(
    public navCtrl: NavController,
    private camera: Camera,
    private actionSheetCtrl: ActionSheetController,
    private toast: Toast,
    public progress: NgProgress,
    private tts: TextToSpeech,
    private speechRecognition: SpeechRecognition,
    public alertController: AlertController
    ) {
      this.tts.speak('ระบบบริหารจัดการทรัพย์สิน สวัสดีค่ะ')
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));

      // Request permissions
      this.speechRecognition.requestPermission()
        .then(
              () => console.log('Granted'),
              () => console.log('Denied')
        )
    }

    async presentAlert() {
      const title = "ระบบบริหารจัดการทรัพย์สิน"
      const subheader = "คุณสมบัติของแอพพลิเคชั่น"
      const mes = "- สั่งการด้วยเสียง <br> - อ่านตัวอักษร / ข้อความ <br> - ประมวลผลข้อความจากภาพ"
      const alert = await this.alertController.create({
        header: title,
        subHeader: subheader,
        message: mes,
        buttons: ['ตกลง']
      });
  
      await alert.present();
    }

    async takePhoto() {    
      let actionSheet = await this.actionSheetCtrl.create({
        buttons: [
          {
            text: 'เลือกไฟล์ภาพ',
            handler: () => {
              this.getPicture(this.camera.PictureSourceType.PHOTOLIBRARY);
            }
          }, {
            text: 'กล้องถ่ายภาพ',
            handler: () => {
              this.getPicture(this.camera.PictureSourceType.CAMERA);
            }
          }, {
            text: 'ยกเลิก',
            role: 'cancel'
          }
        ]
      });
      actionSheet.present();
    }
   
    getPicture(sourceType: PictureSourceType) {
      this.camera.getPicture({
        quality: 100,
        destinationType: this.camera.DestinationType.DATA_URL,
        sourceType: sourceType,
        allowEdit: true,
        saveToPhotoAlbum: false,
        correctOrientation: true
      }).then((imageData) => {
        this.selectedImage = `data:image/jpeg;base64,${imageData}`;
        // this.toast.show('Image is shown', '5000', 'bottom').subscribe(
        //   toast => {
        //     console.log(toast);
        //   }
        // );
        this.recognizeImage();
      });
    }

    listen(){
      let options = {
        language: 'th-TH',
      }
      // Start the recognition process
      this.speechRecognition.startListening(options)
        .subscribe(
          (matches: string[]) => this.talk('คีย์เวิร์ดที่ต้องการค้นหาคือ' + matches[0].toString()),
          (onerror) => console.log('error:', onerror)
        )

    }

    listenUsername(){
      let options = {
        language: 'th-TH',
      }
      // Start the recognition process
      this.speechRecognition.startListening(options)
        .subscribe(
          (matches: string[]) => {
            this.username = matches[0].toString();
            this.inputlastname.setFocus();
          },
          (onerror) => {
            console.log('error:', onerror);
          }
        )
        this.inputname.setFocus();
    }

    listenLastname(){
      let options = {
        language: 'th-TH',
      }
      // Start the recognition process
      this.speechRecognition.startListening(options)
        .subscribe(
          (matches: string[]) => {
            this.lastname = matches[0].toString();
            this.inputnote.setFocus();
          },
          (onerror) => {
            console.log('error:', onerror);
          }
        )
        this.inputlastname.setFocus();
    }

    listenNote(){
      let options = {
        language: 'th-TH',
      }
      // Start the recognition process
      this.speechRecognition.startListening(options)
        .subscribe(
          (matches: string[]) => {
            this.note = this.note + matches[0].toString() + '\n';
            this.inputhidden.setFocus();
          },
          (onerror) => {
            console.log('error:', onerror);
          }
        )
        this.inputnote.setFocus();
    }

    talk(message: string){
      this.tts.speak(message)
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));
    }
   
    recognizeImage() {
      // this.toast.show('Tesseract JS', '1000', 'bottom').subscribe(
      //   toast => {
      //     console.log(toast);
      //   }
      // );

      const worker = createWorker({
        logger: m => {
          console.log(m);
          this.waiting = true;
        }

      });
      (async () => {
        await worker.load();
        // await worker.loadLanguage('eng');
        // await worker.initialize('eng');
        await worker.loadLanguage('tha');
        await worker.initialize('tha');

        //const { data: { text } } = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');
        const { data: { text } } = await worker.recognize(this.selectedImage);
        console.log(text);
        this.waiting = false;
        this.imageText = text;
        await worker.terminate();
      })();

      // Tesseract.recognize(this.selectedImage, 'eng')
      // // .progress(message => {
      // //   if (message.status === 'recognizing text')
      // //   this.progress.set(message.progress);
      // // })
      // .catch(err => this.imageText = err)
      // .then(result => {
      //   console.log(result);
      //   this.imageText = result.toString();
      // })
      // // .finally(resultOrError => {
      // //   this.progress.complete();
      // // });
    }

    readresult(){
      this.tts.speak(this.imageText)
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));

    }
}
