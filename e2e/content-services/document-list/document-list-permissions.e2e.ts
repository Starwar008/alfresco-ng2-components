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

import { browser } from 'protractor';
import { ContentServicesPage } from '../../pages/adf/content-services.page';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';
import { LoginSSOPage, ErrorPage, StringUtil, BrowserActions, ApiService } from '@alfresco/adf-testing';
import { UsersActions } from '../../actions/users.actions';

describe('Document List Component', () => {

    const loginPage = new LoginSSOPage();
    const contentServicesPage = new ContentServicesPage();
    const errorPage = new ErrorPage();
    const navigationBarPage = new NavigationBarPage();
    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);

    let privateSite;
    let acsUser = null;

    describe('Permission Message', () => {
        beforeAll(async () => {
            const siteName = `PRIVATE_TEST_SITE_${StringUtil.generateRandomString(5)}`;
            const privateSiteBody = { visibility: 'PRIVATE', title: siteName };

            await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

            acsUser = await usersActions.createUser();

            privateSite = await apiService.getInstance().core.sitesApi.createSite(privateSiteBody);

            await loginPage.login(acsUser.email, acsUser.password);
        });

        afterAll(async () => {
            await navigationBarPage.clickLogoutButton();
            await apiService.getInstance().core.sitesApi.deleteSite(privateSite.entry.id, { permanent: true });
        });

        it('[C217334] Should display a message when accessing file without permissions', async () => {
            await BrowserActions.getUrl(browser.params.testConfig.adf.url + '/files/' + privateSite.entry.guid);
            await expect(await errorPage.getErrorCode()).toBe('403');
            await expect(await errorPage.getErrorDescription()).toBe('You\'re not allowed access to this resource on the server.');
        });

        it('[C279924] Should display custom message when accessing a file without permissions', async () => {
            await contentServicesPage.goToDocumentList();
            await contentServicesPage.enableCustomPermissionMessage();
            await BrowserActions.getUrl(browser.params.testConfig.adf.url + '/files/' + privateSite.entry.guid);
            await expect(await errorPage.getErrorCode()).toBe('403');
        });
   });
});
