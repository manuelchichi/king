import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import { ApiService } from '../../services/api.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { ToastService } from '../../services/toast.service';

@AutoUnsubscribe()
@Component({
    selector: 'app-dialog-info-key',
    templateUrl: './dialog-info-key.component.html',
    styleUrls: ['./dialog-info-key.component.scss']
})
export class DialogInfoKeyComponent implements OnInit, OnDestroy {
    keys;
    loading = true;
    key = '';
    ttl = 0;
    consumerId;
    consumerName;

    constructor(@Inject(MAT_DIALOG_DATA) public consumer: string, private api: ApiService, private toast: ToastService,
                private dialogHelper: DialogHelperService, private translate: TranslateService) { }

    ngOnInit(): void {
        this.consumerId = this.consumer['id'];
        this.consumerName = this.consumer['username'];
        this.getApiKeys();
    }

    ngOnDestroy(): void {
    }

    /**
     * Obtengo los acls
     */
    getApiKeys() {
        this.loading = true;

        // Recojo los datos del api
        this.api.getConsumerApiKeys(this.consumerId)
            .subscribe({
                next: (keys) => {
                    this.keys = keys['data'];
                },
                error: (error) => this.toast.error_general(error),
                complete: () =>
                    this.loading = false
            });
    }

    /**
     * Muestra u oculta la api key
     * @param key Clave
     * @param hide Mostrar u ocultar
     */
    showKey(key, hide) {
        if (key === null) {
            return '';
        }

        if (!hide) {
            key = key.substring(0, 5).padEnd(key.length, '*');
        }
        return key;
    }

    /**
     * Descarga en formato JSON los datos
     */
    downloadJson() {
        const blob = new Blob([JSON.stringify(this.keys, null, 2)], {type: 'text/json'});
        saveAs(blob, 'apikey.consumer_' + this.consumerName + '.json');
    }

    /**
     * Añade un api key al consumidor
     */
    addApiKeyToConsumer() {
        let body = {};
        if (this.key !== '') {
            body['key'] = this.key;
        }
        if (this.ttl > 0) {
            body['ttl'] = this.ttl;
        }

        // Guardo el acl en el consumidor
        this.api.postConsumerApiKey(this.consumerId, body)
            .subscribe({
                next: (res) => {
                    this.toast.success('text.id_extra', 'success.new_key', {msgExtra: res['id']});
                    this.getApiKeys();
                    this.key = '';
                    this.ttl = 0;
                },
                error: (error) =>
                    this.toast.error_general(error, {disableTimeOut: true})
            });
    }

    /**
     * Elimina un api key
     * @param apikey api key
     */
    deleteApiKey(apikey) {
        this.dialogHelper.deleteElement({
            id: apikey.id,
            consumerId: this.consumerId,
            name: this.showKey(apikey.key, false) + ' [' + this.translate.instant('text.username') + ' ' + this.consumerName + ']'
        }, 'key')
            .then(() => { this.getApiKeys(); })
            .catch(() => {});
    }
}
