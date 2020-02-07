/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Injectable } from '@angular/core';
import { AlfrescoApiService, AppConfigService, LogService } from '@alfresco/adf-core';
import { ProcessQueryCloudRequestModel } from '../models/process-cloud-query-request.model';
import { Observable, throwError } from 'rxjs';
import { ProcessListCloudSortingModel } from '../models/process-list-sorting.model';
import { BaseCloudService } from '../../../services/base-cloud.service';

@Injectable({ providedIn: 'root' })
export class ProcessListCloudService extends BaseCloudService {

    constructor(apiService: AlfrescoApiService,
                appConfigService: AppConfigService,
                private logService: LogService) {
        super(apiService);
        this.contextRoot = appConfigService.get('bpmHost', '');
    }

    /**
     * Finds a process using an object with optional query properties.
     * @param requestNode Query object
     * @returns Process information
     */
    getProcessByRequest(requestNode: ProcessQueryCloudRequestModel): Observable<any> {
        if (requestNode.appName || requestNode.appName === '') {
            const queryUrl = `${this.getBasePath(requestNode.appName)}/query/v1/process-instances`;
            const queryParams = this.buildQueryParams(requestNode);
            const sortingParams = this.buildSortingParam(requestNode.sorting);
            if (sortingParams) {
                queryParams['sort'] = sortingParams;
            }

            return this.get(queryUrl, queryParams);
        } else {
            this.logService.error('Appname is mandatory for querying task');
            return throwError('Appname not configured');
        }
    }

    private isPropertyValueValid(requestNode: any, property: string) {
        return requestNode[property] !== '' && requestNode[property] !== null && requestNode[property] !== undefined;
    }

    private buildQueryParams(requestNode: ProcessQueryCloudRequestModel): Object {
        const queryParam = {};

        for (const property in requestNode) {
            if (requestNode.hasOwnProperty(property) &&
                !this.isExcludedField(property) &&
                this.isPropertyValueValid(requestNode, property)) {
                queryParam[property] = requestNode[property];
            }
        }

        return queryParam;
    }

    private isExcludedField(property: string): boolean {
        return property === 'appName' || property === 'sorting';
    }

    private buildSortingParam(models: ProcessListCloudSortingModel[]): string {
        let finalSorting: string = '';
        if (models) {
            for (const sort of models) {
                if (!finalSorting) {
                    finalSorting = `${sort.orderBy},${sort.direction}`;
                } else {
                    finalSorting = `${finalSorting}&${sort.orderBy},${sort.direction}`;
                }
            }
        }
        return encodeURI(finalSorting);
    }
}
