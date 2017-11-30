import { HtmlInfoWindow } from '@ionic-native/google-maps';
import { Component, NgZone } from '@angular/core';
import { LoadingController, Loading, NavController, Platform, Events } from 'ionic-angular';
import { Geolocation } from "@ionic-native/geolocation";
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/map';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  MarkerIcon,
  Marker,
  MarkerCluster,
  GoogleMapsAnimation
} from '@ionic-native/google-maps';
import { never } from 'rxjs/observable/never';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { ApiProvider } from '../../providers/api/api';
declare var document : any;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  map: GoogleMap;
  totalElements = 0;
  loading: Loading;
  userMarker: Marker;
  lastMarker: Marker;
  addedMarkers = 0;
  loaded = false;
  MarkerCluster: MarkerCluster;
  pickedLocation = null;
  htmInfoWindow: HtmlInfoWindow = new HtmlInfoWindow();
  constructor(public navCtrl: NavController,public apiProvider : ApiProvider, public loadingCtrl: LoadingController,public events : Events,public geolocation: Geolocation, public toastCtrl: ToastController,public platform: Platform, private _ngZone: NgZone, private googleMaps: GoogleMaps) {

  }
  delete(location){
    this.pickedLocation = null;
    document.getElementsByTagName('body')[0].focus();
  }
  ionViewDidLoad(){
    this.events.unsubscribe("PopulationPickedEvent");
    this.events.subscribe("PopulationPickedEvent",(res) => {
      console.log(res.population);
      this.pickedLocation = res.population;
    });
  }
  ionViewDidEnter() {
    if(this.map == null){
      this.platform.ready().then(() => {
        this.loadMap();
      });
    }else{
      this.map.setVisible(true);
    }
    
  }

  goMyLocation() {
    this.loading = this.loadingCtrl.create();
    this.loading.present();
    this.geolocation.getCurrentPosition({ maximumAge: 86400,timeout: 4000 }).then(success => {
      console.log(success);
      let toast = this.toastCtrl.create({
        message: "CENTERED IN USER",
        duration: 3000,
        position: 'bottom'
      });
      this.clearLast();
      this.loading.dismissAll();
      toast.onDidDismiss(() => {
        console.log('Dismissed toast');
      });

      toast.present();
      this.createUserMarker(success, true);
    }).catch(error => {
      console.log(error);
      this.loading.dismissAll();
      let toast = this.toastCtrl.create({
        message: "NO USER LOC",
        duration: 3000,
        position: 'bottom'
      });
      this.createUserMarker(null, true);
      toast.onDidDismiss(() => {
        console.log('Dismissed toast');
      });
      toast.present();
    });
  }


  ionViewWillLeave() {
    if (this.MarkerCluster != null) {
      this.MarkerCluster = null;
    }
    if (this.map != undefined) {
      this.map.setVisible(false);
    }
  }

  createMarker(next, map: GoogleMap) {
    var image = {};
    if (next.Guardia == true) {
      image = {
        url: "assets/img/farmoberta.png",
        size: {
          width: 22,
          height: 32
        }
      }
    } else {
      image = {
        url: "assets/img/farmacia.png",
        size: {
          width: 22,
          height: 32
        }
      }
    }
    console.log(next);
    const markerOption = {
      title: /*"Farmàcia " + next.Nom*/ null,
      snippet: /*next.Adreca + "\n" + next.Poblacio + "\n" + "Horari "+next.HorariMati*/ null,
      icon: image,
      position: {
        lat: Number(next.geometry.coordinates[1]),
        lng: Number(next.geometry.coordinates[0])
      },
      "styles": {
        "maxWidth": "80%" // This can be percentage (%) or just a numeric value from 0.0 to 1.0 for percentile representation, or the numeric width in pixels.
      },
      farmaId: next.IdFarmacia,
      content: next
    }
    this.MarkerCluster.addMarker(markerOption);
    this.addedMarkers++;
  }

  loadItems() {
    this.totalElements = 0;
    this.addedMarkers = 0;
    this.map.addMarkerCluster({
      maxZoomLevel: 14,
      boundsDraw: false,
      markers: [],
      icons: [
        {
          min: 15, url: "assets/img/clusterer.png",
          anchor: { x: 21, y: 21 },
          label: {
            color: "white",
            bold: true,
            italic: false,
            fontSize: 14
          },
          size: {
            width: 42,
            height: 42
          }
        }
      ]
    }).then(cluster => {
      this.MarkerCluster = cluster;
      this.MarkerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
        this.onMarkerClick(params);
      });
      this.MarkerCluster.on(GoogleMapsEvent.CLUSTER_CLICK).subscribe((params) => {
        this.clearLast();
      });
    });


    this.apiProvider.requestItems().subscribe((next: any) => {
      //console.log("NEXT : ", next);
      this.createMarker(next, this.map);
      this.totalElements++;
    }, (err) => {
      console.log("ERROR : ", err);
    }, () => {

      console.log("COMPLETE!");
      this.map.setCameraZoom(10);
      this.geolocation.getCurrentPosition({ maximumAge: 880400, timeout: 4000 }).then(success => {
        console.error(success);
        this.createUserMarker(success);
      }).catch( (err) => {
        console.error(err);
        this.createUserMarker(null);
        let watch = this.geolocation.watchPosition();
        watch.subscribe((data) => {
         // data can be a set of coordinates, or an error (if an error occurred).
         // data.coords.latitude
         // data.coords.longitude
         console.log(data);
         this.createUserMarker(data);
        });
      });
    });
  }

  goSearch(){
    
  }

  replaceAll(target,search, replacement) {
    return target.split(search).join(replacement);
  }

  cleanUpForGoogle(string : string){
    //string = this.replaceAll(string," ","+");
    //string = this.replaceAll(string,",","+");
    return string;
  }


  onMarkerClick(params: any[]) {
    this.clearLast();
    let marker: Marker = <Marker>params.pop();
    console.log(marker);
    var image = {
      url: "assets/img/farmselect.png",
      size: {
        width: 22,
        height: 32
      }
    }
    marker.setIcon(image);
    var content = marker.get("content");
    console.log(content);
    let markerMapsUrl = "https://www.google.com/maps/dir/?api=1&saddr=My+Location&destination=" + content.geometry.coordinates[1] + ","+content.geometry.coordinates[0] + "&mode=driving" ;
    console.log(encodeURI(markerMapsUrl));
    let html: string =
      '<div id="marker-' + content.properties.id + '" class="infowindowContent">' +
      '<h3>Location ' + content.properties.thoroughfare + '</h3>';
      html += '<img onClick="window.open(\'' + encodeURI(markerMapsUrl) + '\',\'_system\');" class="colImg" src="assets/img/comarribar_cof.png"/>' +
      '</div>';
    this.htmInfoWindow.setContent(html);
    this.htmInfoWindow.one(GoogleMapsEvent.INFO_OPEN).then((res) => {
      //alert("hi open infowindow");
    });



    this.htmInfoWindow.open(marker);
    this.lastMarker = marker;
  }

  loadMap() {

    let mapOptions: GoogleMapOptions = {
      controls: {
        myLocationButton: false,
        mapToolbar: false
      },
      camera: {
        target: {
          lat: 41.6166565,
          lng: 0.6290362
        },
        zoom: 9
      }, styles: [
        {
          "featureType": "poi.business",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "poi.business",
          "elementType": "labels",
          "stylers": [
            {
              "color": "#bff2ff "
            }
          ]
        },
        {
          "featureType": "poi.business",
          "elementType": "labels.icon",
          "stylers": [
            {
              "color": "#cafffc "
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "transit",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        }
      ]
    };

    this.map = GoogleMaps.create('map_canvas', mapOptions);
    console.log(this.map);
    // Wait the MAP_READY before using any methods.
    this.map.one(GoogleMapsEvent.MAP_READY)
      .then(() => {
        console.log('Map is ready!');
        this.loadItems();
        this.loaded = true;
        this.map.on(GoogleMapsEvent.MAP_CLICK).subscribe((res) => {
          console.log(res);
          console.log("Map Clicked");
          console.log(this.lastMarker);
          this.clearLast();
        });
      });
  }

  createUserMarker(success, fromButton?) {
    if (success == null) {
      success = {
        coords: {
          latitude: 41.6166565,
          longitude: 0.6290362
        }
      }
    }
    if (fromButton == null) {
      fromButton = false;
    }

    var image = {
      url: "assets/img/user_loc.png",
      clickable: false,
      size: {
        width: 32,
        height: 32
      }
    }
    const markerOption: MarkerOptions = {
      title: null,
      snippet: null,
      flat: true,
      icon: image,
      position: {
        lat: success.coords.latitude,
        lng: success.coords.longitude
      },
      farmaId: -1,
      clickable: false
    }
    if(this.userMarker != null){
      this.userMarker.destroy();
      this.userMarker = null;
    }
    this.map.addMarker(markerOption).then((marker: Marker) => {
      this.userMarker = marker;
      console.log(this.userMarker);
    }).catch((err)=>{
      console.error(err);
    });
    if (fromButton) {
      var position = { target: { lat: success.coords.latitude, lng: success.coords.longitude }, zoom: 14, duration: 2000 };
      this.map.animateCamera(position).then(res => {

      });
    } else {
      var position = { target: { lat: success.coords.latitude, lng: success.coords.longitude }, zoom: 10, duration: 2000 };
      this.map.animateCamera(position).then(res => {

      });
    }

  }

  clearLast() {
    if (this.lastMarker != undefined) {
      var image = {};
      if (this.lastMarker.get("content").Guardia == true) {
        image = {
          url: "assets/img/farmoberta.png",
          size: {
            width: 22,
            height: 32
          }
        }
      } else {
        image = {
          url: "assets/img/farmacia.png",
          size: {
            width: 22,
            height: 32
          }
        }
      }
      this.lastMarker.setIcon(image);
    } else {
      console.log("marker is undefined");
    }
  }
}
