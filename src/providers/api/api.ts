import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Http, RequestOptions, Headers, URLSearchParams } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
/*
  Generated class for the ApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ApiProvider {

  constructor(public http: HttpClient) {
    console.log('Hello ApiProvider Provider');
  }
  requestItems(){
    let url = "http://test.cardionlive.com/api/list/defibrillators?session_token=8eIuUkOYSArHsW6Ro51ThwoiTGW3Co8L&key=Xh1RnwPwTEJMjy3vY2Co9jRjcYAHmHkL&device=mobile";
    let body = new URLSearchParams();
    let headers = new HttpHeaders({ "Content-Type": "application/json","accept":"*/*"});
    var observable =  this.http.get(url, {headers : headers}).map((res : any) => {
      if(res[0].error != null){
        return [];
      }
      return res;
    }, (err) => {
      console.error(err);
      return [];
    });
    //return observable.takeWhile( x => x != null);
    return observable.flatMap((x : any) => {
      return x;
    });
  }
}
