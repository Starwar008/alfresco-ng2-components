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

import {
    ApiService,
    AppListCloudPage,
    GroupIdentityService,
    IdentityService,
    LoginSSOPage,
    ProcessDefinitionsService,
    ProcessInstancesService,
    StringUtil
} from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { ProcessCloudDemoPage } from '../pages/adf/demo-shell/process-services/process-cloud-demo.page';
import { TasksCloudDemoPage } from '../pages/adf/demo-shell/process-services/tasks-cloud-demo.page';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import CONSTANTS = require('../util/constants');

describe('Process list cloud', () => {

    describe('Process List - Custom Action Menu', () => {

        const simpleApp = browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.name;

        const loginSSOPage = new LoginSSOPage();
        const navigationBarPage = new NavigationBarPage();
        const appListCloudComponent = new AppListCloudPage();
        const processCloudDemoPage = new ProcessCloudDemoPage();
        const tasksCloudDemoPage = new TasksCloudDemoPage();

        const apiService = new ApiService();
        const identityService = new IdentityService(apiService);
        const groupIdentityService = new GroupIdentityService(apiService);
        const processDefinitionService = new ProcessDefinitionsService(apiService);
        const processInstancesService = new ProcessInstancesService(apiService);

        let testUser, groupInfo, editProcess, deleteProcess;

        beforeAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);

        testUser = await identityService.createIdentityUserWithRole( [identityService.ROLES.ACTIVITI_USER]);
        groupInfo = await groupIdentityService.getGroupInfoByGroupName('hr');
        await identityService.addUserToGroup(testUser.idIdentityService, groupInfo.id);

        await apiService.login(testUser.email, testUser.password);
        const processDefinition = await processDefinitionService
                .getProcessDefinitionByName(browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.processes.simpleProcess, simpleApp);

        editProcess = await processInstancesService.createProcessInstance(processDefinition.entry.key, simpleApp, {
                'name': StringUtil.generateRandomString(),
                'businessKey': StringUtil.generateRandomString()
            });
        deleteProcess = await processInstancesService.createProcessInstance(processDefinition.entry.key, simpleApp, {
                'name': StringUtil.generateRandomString(),
                'businessKey': StringUtil.generateRandomString()
            });

        await loginSSOPage.login(testUser.email, testUser.password);
        });

        afterAll(async () => {
            await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
            await identityService.deleteIdentityUser(testUser.idIdentityService);
        });

        beforeAll(async () => {
            await navigationBarPage.navigateToProcessServicesCloudPage();
            await appListCloudComponent.checkApsContainer();
            await appListCloudComponent.goToApp(simpleApp);
            await tasksCloudDemoPage.clickSettingsButton();
            await tasksCloudDemoPage.enableTestingMode();
            await tasksCloudDemoPage.enableActionMenu();
            await tasksCloudDemoPage.enableContextMenu();
            await tasksCloudDemoPage.addActionIsDisplayed();
            await tasksCloudDemoPage.addAction('edit');
            await tasksCloudDemoPage.actionAdded('edit');
            await tasksCloudDemoPage.addAction('delete');
            await tasksCloudDemoPage.actionAdded('delete');
            await tasksCloudDemoPage.addDisabledAction('disabledaction');
            await tasksCloudDemoPage.actionAdded('disabledaction');
            await tasksCloudDemoPage.addInvisibleAction('invisibleaction');
            await tasksCloudDemoPage.actionAdded('invisibleaction');
            await tasksCloudDemoPage.clickAppButton();
            await processCloudDemoPage.processFilterCloudComponent.clickOnProcessFilters();
            await processCloudDemoPage.processFilterCloudComponent.clickRunningProcessesFilter();
        });

        it('[C315236] Should be able to see and execute custom action menu', async () => {
            await processCloudDemoPage.editProcessFilterCloudComponent().openFilter();
            await processCloudDemoPage.editProcessFilterCloudComponent().setProcessName(editProcess.entry.name);
            await expect(await processCloudDemoPage.processFilterCloudComponent.getActiveFilterName()).toBe(CONSTANTS.PROCESS_FILTERS.RUNNING);
            await processCloudDemoPage.processListCloudComponent().checkProcessListIsLoaded();
            await processCloudDemoPage.processListCloudComponent().checkContentIsDisplayedById(editProcess.entry.id);
            await processCloudDemoPage.processListCloudComponent().clickOptionsButton(editProcess.entry.id);
            await expect(await processCloudDemoPage.processListCloudComponent().isCustomActionEnabled('disabledaction')).toBe(false);
            await expect(await processCloudDemoPage.processListCloudComponent().getNumberOfOptions()).toBe(3);
            await processCloudDemoPage.processListCloudComponent().clickOnCustomActionMenu('edit');
            await processCloudDemoPage.checkActionExecuted(editProcess.entry.id, 'edit');

            await processCloudDemoPage.editProcessFilterCloudComponent().setProcessName(deleteProcess.entry.name);
            await browser.sleep(1000);
            await processCloudDemoPage.processListCloudComponent().rightClickOnRow(deleteProcess.entry.id);
            await expect(await processCloudDemoPage.processListCloudComponent().isCustomActionEnabled('disabledaction')).toBe(false);
            await expect(await processCloudDemoPage.processListCloudComponent().getNumberOfOptions()).toBe(3);
            await processCloudDemoPage.processListCloudComponent().clickContextMenuActionNamed('delete');
            await processCloudDemoPage.checkActionExecuted(deleteProcess.entry.id, 'delete');
        });
    });
});
