/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
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
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-cloud-layout',
    templateUrl: './cloud-layout.component.html',
    styleUrls: ['./cloud-layout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CloudLayoutComponent implements OnInit {
    displayMenu = true;
    applicationName: string;

    constructor(private router: Router, private route: ActivatedRoute) {
    }

    ngOnInit() {
        this.route.params.subscribe((params) => {
            this.applicationName = params.applicationName;
        });
    }

    onTaskFilterSelected(filter) {
        const currentFilter = Object.assign({}, filter);
        this.router.navigate([`/cloud/${this.applicationName}/tasks/`], { queryParams: currentFilter });
    }

    onStartTask() {
        this.router.navigate([`/cloud/${this.applicationName}/start-task/`]);
    }

    onProcessFilterSelected(filter) {
        const queryParams = {
            status: filter.query.state,
            filterName: filter.name,
            sort: filter.query.sort,
            order: filter.query.order
        };
        this.router.navigate([`/cloud/${this.applicationName}/processes/`], { queryParams: queryParams });
    }
}
