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

import { UsersActions } from '../../actions/users.actions';
import {
    LoginSSOPage,
    BrowserActions,
    Widget,
    FormPage,
    ApplicationsUtil,
    ProcessUtil,
    ApiService
} from '@alfresco/adf-testing';
import { TasksPage } from '../../pages/adf/process-services/tasks.page';
import CONSTANTS = require('../../util/constants');
import { browser } from 'protractor';
import { FormDemoPage } from '../../pages/adf/demo-shell/process-services/form-demo.page';
import { customDateFormAPS1 } from '../../resources/forms/custom-date-form';

describe('Date widget', () => {

    const app = browser.params.resources.Files.WIDGET_CHECK_APP.DATE;

    const loginPage = new LoginSSOPage();
    const taskPage = new TasksPage();
    const widget = new Widget();

    const dateWidget = widget.dateWidget();
    let appModel;
    let processUserModel;
    let deployedApp, process;

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);
    const applicationsService = new ApplicationsUtil(apiService);

    beforeAll(async () => {
       await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

       processUserModel = await usersActions.createUser();

       await apiService.getInstance().login(processUserModel.email, processUserModel.password);
       appModel = await applicationsService.importPublishDeployApp(browser.params.resources.Files.WIDGET_CHECK_APP.file_path);

       const appDefinitions = await apiService.getInstance().activiti.appsApi.getAppDefinitions();
       deployedApp = appDefinitions.data.find((currentApp) => {
            return currentApp.modelId === appModel.id;
        });
       process = await new ProcessUtil(apiService).startProcessByDefinitionName(appModel.name, app.processName);
       await loginPage.login(processUserModel.email, processUserModel.password);
   });

    afterAll(async () => {
        await apiService.getInstance().activiti.processApi.deleteProcessInstance(process.id);
        await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        await apiService.getInstance().activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
   });

    describe('Simple App', () => {
        beforeEach(async () => {
            const urlToNavigateTo = `${browser.params.testConfig.adf.url}/activiti/apps/${deployedApp.id}/tasks/`;
            await BrowserActions.getUrl(urlToNavigateTo);
            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.formFields().checkFormIsDisplayed();
        });

        it('[C268814] Should be able to set general settings for Date widget', async () => {
            await expect(await dateWidget.getDateLabel(app.FIELD.date_input)).toContain('Date');
            await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);
            await dateWidget.setDateInput(app.FIELD.date_input, '20-10-2018');
            await taskPage.formFields().saveForm();
            await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(true);
        });

        it('[C277234] Should be able to set advanced settings for Date widget ', async () => {
            await dateWidget.setDateInput(app.FIELD.date_between_input, '20-10-2017');
            await taskPage.formFields().saveForm();
            await expect(await dateWidget.getErrorMessage(app.FIELD.date_between_input)).toBe('Can\'t be less than 1-10-2018');
            await dateWidget.clearDateInput(app.FIELD.date_between_input);
            await dateWidget.setDateInput(app.FIELD.date_between_input, '20-10-2019');
            await taskPage.formFields().saveForm();
            await expect(await dateWidget.getErrorMessage(app.FIELD.date_between_input)).toBe('Can\'t be greater than 31-10-2018');
        });
    });

    describe('Form Demo Page', () => {
        const formDemoPage = new FormDemoPage();
        const formJson = JSON.parse(customDateFormAPS1);
        const formPage = new FormPage();

        beforeAll(async () => {
            const urlFormDemoPage = `${browser.params.testConfig.adf.url}/form`;
            await BrowserActions.getUrl(urlFormDemoPage);
        });

        it('[C313199] Should display the validation for min and max date values with custom date format', async () => {
            await formDemoPage.setConfigToEditor(formJson);
            await dateWidget.setDateInput('datefield', '18-7-19');
            await formPage.saveForm();
            await expect(await dateWidget.getErrorMessage('datefield'))
                .toBe('Can\'t be less than 19-7-19', 'Min date validation is not working');
            await dateWidget.clearDateInput('datefield');
            await dateWidget.setDateInput('datefield', '20-7-19');
            await formPage.saveForm();
            await expect(await dateWidget.getErrorMessage('datefield'))
                .toBe('Can\'t be greater than 19-8-19', 'Max date validation is not working');
            await dateWidget.clearDateInput('datefield');
            await dateWidget.setDateInput('datefield', '19-7-19');
            await formPage.saveForm();
            await dateWidget.checkErrorMessageIsNotDisplayed('datefield');
        });
    });
});
