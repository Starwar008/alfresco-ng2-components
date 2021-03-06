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

import { ApiService, Application, AppListCloudPage, IdentityService, LocalStorageUtil, LoginSSOPage } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';

describe('Applications list', () => {

    const simpleApp = browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.name;

    const loginSSOPage = new LoginSSOPage();
    const navigationBarPage = new NavigationBarPage();
    const appListCloudPage = new AppListCloudPage();

    const apiService = new ApiService();
    const applicationsService = new Application(apiService);
    const identityService = new IdentityService(apiService);

    let testUser;
    const appNames = [];
    let applications;

    beforeAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        testUser = await identityService.createIdentityUserWithRole( [identityService.ROLES.ACTIVITI_USER, identityService.ROLES.ACTIVITI_DEVOPS]);

        await loginSSOPage.login(testUser.email, testUser.password);
        await apiService.login(testUser.email, testUser.password);

        applications = await applicationsService.getApplicationsByStatus('RUNNING');

        applications.list.entries.forEach(app => {
            appNames.push(app.entry.name.toLowerCase());
        });

        await LocalStorageUtil.setConfigField('alfresco-deployed-apps', '[]');
        await LocalStorageUtil.apiReset();
   });

    afterAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        await identityService.deleteIdentityUser(testUser.idIdentityService);
   });

    it('[C310373] Should all the app with running state be displayed on dashboard when alfresco-deployed-apps is not used in config file', async () => {
        await navigationBarPage.navigateToProcessServicesCloudPage();
        await appListCloudPage.checkApsContainer();

        const list = await appListCloudPage.getNameOfTheApplications();

        await expect(JSON.stringify(list)).toEqual(JSON.stringify(appNames));
    });

    it('[C289910] Should the app be displayed on dashboard when is deployed on APS', async () => {
        await browser.refresh();
        await navigationBarPage.navigateToProcessServicesCloudPage();
        await appListCloudPage.checkApsContainer();

        await appListCloudPage.checkAppIsDisplayed(simpleApp);
        await appListCloudPage.checkAppIsDisplayed(browser.params.resources.ACTIVITI_CLOUD_APPS.CANDIDATE_BASE_APP.name);
        await appListCloudPage.checkAppIsDisplayed(browser.params.resources.ACTIVITI_CLOUD_APPS.SUB_PROCESS_APP.name);

        await expect(await appListCloudPage.countAllApps()).toEqual(3);
    });
});
