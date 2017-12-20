/*
 * <<
 * wormhole
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import React from 'react'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import Helmet from 'react-helmet'
import { preProcessSql } from '../../utils/util'
import CodeMirror from 'codemirror'
require('../../../node_modules/codemirror/addon/display/placeholder')
require('../../../node_modules/codemirror/mode/javascript/javascript')

import Flow from '../Flow'
import Manager from '../Manager'
import Job from '../Job'
import Namespace from '../Namespace'
import User from '../User'
import Udf from '../Udf'
import Resource from '../Resource'

import WorkbenchFlowForm from './WorkbenchFlowForm'
import WorkbenchStreamForm from './WorkbenchStreamForm'
import WorkbenchJobForm from './WorkbenchJobForm'
import FlowEtpStrategyForm from './FlowEtpStrategyForm'
import FlowTransformForm from './FlowTransformForm'
import StreamConfigForm from './StreamConfigForm'
// import StreamDagModal from './StreamDagModal'
// import FlowDagModal from './FlowDagModal'

import Button from 'antd/lib/button'
import Tabs from 'antd/lib/tabs'
import Modal from 'antd/lib/modal'
const TabPane = Tabs.TabPane
import Steps from 'antd/lib/steps'
const Step = Steps.Step
import message from 'antd/lib/message'
import Moment from 'moment'

import {loadUserAllFlows, loadAdminSingleFlow, loadSelectStreamKafkaTopic, loadSourceSinkTypeNamespace, loadSinkTypeNamespace, loadTranSinkTypeNamespace, loadSourceToSinkExist, addFlow, editFlow, queryFlow} from '../Flow/action'
import {loadUserStreams, loadAdminSingleStream, loadStreamNameValue, loadKafka, loadStreamConfigJvm, addStream, loadStreamDetail, editStream} from '../Manager/action'
import {loadSelectNamespaces, loadUserNamespaces} from '../Namespace/action'
import {loadUserUsers, loadSelectUsers} from '../User/action'
import {loadResources} from '../Resource/action'
import {loadSingleUdf} from '../Udf/action'
import {loadJobName, loadJobSourceNs, loadJobSinkNs, loadJobSourceToSinkExist, addJob, queryJob, editJob} from '../Job/action'

import { selectFlows, selectFlowSubmitLoading, selectSourceToSinkExited } from '../Flow/selectors'
import { selectStreams, selectStreamSubmitLoading, selectStreamNameExited } from '../Manager/selectors'
import { selectProjectNamespaces, selectNamespaces } from '../Namespace/selectors'
import { selectUsers } from '../User/selectors'
import { selectResources } from '../Resource/selectors'
import { selectJobNameExited, selectJobSourceToSinkExited } from '../Job/selectors'

export class Workbench extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      projectId: '',
      isWormhole: true,
      flowMode: '',
      streamMode: '',
      transformMode: '',
      jobMode: '',
      formStep: 0,
      tabPanelKey: '',

      // all and parts of flow/stream/namespace/user
      userClassHide: 'hide',
      namespaceClassHide: 'hide',
      flowClassHide: 'hide',
      streamClassHide: 'hide',
      jobClassHide: 'hide',
      udfClassHide: 'hide',

      transformModalVisible: false,
      etpStrategyModalVisible: false,
      sinkConfigModalVisible: false,
      jobSinkConfigModalVisible: false,

      // Flow Modal Transform
      flowFormTranTableSource: [],
      transformTagClassName: '',
      transformTableClassName: 'hide',
      transformValue: '',
      transConnectClass: 'hide',

      step2SinkNamespace: '',
      step2SourceNamespace: '',

      etpStrategyCheck: false,
      streamConfigModalVisible: false,
      sparkConfigModalVisible: false,
      streamConfigCheck: false,
      sparkConfigCheck: false,

      kafkaValues: [],
      kafkaInstanceId: 0,
      flowKafkaInstanceValue: '',
      flowKafkaTopicValue: '',

      streamConfigValues: {},
      streamQueryValues: {},

      // streamDagModalShow: 'hide',
      // flowDagModalShow: 'hide',

      selectStreamKafkaTopicValue: [],
      sourceTypeNamespaceData: [],
      hdfslogNsData: [],
      sinkTypeNamespaceData: [],
      transformSinkTypeNamespaceData: [],
      transformSinkNamespaceArray: [],

      // request data
      resultFiledsOutput: {},
      dataframeShowOrNot: '',
      etpStrategyRequestValue: '',
      transformTableRequestValue: '',
      pushdownConnectRequestValue: '',

      // add flow confirmation data
      resultFieldsValue: 'all',
      dataframeShowNumValue: 'false',
      etpStrategyConfirmValue: '',
      transformTableConfirmValue: '',

      etpStrategyResponseValue: '',
      topicEditValues: [],
      sinkConfigMsg: '',

      responseTopicInfo: [],
      fieldSelected: 'hide',
      dataframeShowSelected: 'hide',

      singleFlowResult: {},
      streamDiffType: 'default',
      pipelineStreamId: 0,
      hdfslogSinkDataSysValue: '',
      hdfslogSinkNsValue: '',

      // job
      jobStepSourceNs: '',
      jobStepSinkNs: '',
      jobSparkConfigValues: {},
      jobSourceNsData: [],
      jobSinkNsData: [],
      jobSinkConfigMsg: '',
      jobResultFiledsOutput: {},
      jobResultFieldsValue: 'all',

      jobTransModalVisible: false,
      jobFormTranTableSource: [],
      jobTranTagClassName: '',
      jobTranTableClassName: 'hide',
      JobTranValue: '',
      JobTranConnectClass: 'hide',
      jobTransValue: '',
      jobTranTableRequestValue: '',
      jobTranTableConfirmValue: '',
      singleJobResult: {},
      startTsVal: '',
      endTsVal: ''
    }
  }

  componentWillMount () {
    const projectId = this.props.router.params.projectId
    this.loadData(projectId)
    this.setState({
      tabPanelKey: 'flow'
    })
  }

  componentWillReceiveProps (props) {
    const projectId = props.router.params.projectId
    if (projectId !== this.state.projectId) {
      this.loadData(projectId)
    }
  }

  loadData (projectId) {
    this.setState({
      projectId: projectId
    })
  }

  changeTag = (key) => {
    const { projectId } = this.state
    const { onLoadAdminSingleFlow, onLoadUserAllFlows, onLoadAdminSingleStream, onLoadUserStreams } = this.props
    const { onLoadSelectNamespaces, onLoadUserNamespaces, onLoadSelectUsers, onLoadUserUsers, onLoadResources, onLoadSingleUdf } = this.props
    let roleTypeTemp = localStorage.getItem('loginRoleType')

    if (key === 'flow') {
      if (roleTypeTemp === 'admin') {
        onLoadAdminSingleFlow(projectId, () => {})
      } else if (roleTypeTemp === 'user') {
        onLoadUserAllFlows(projectId, () => {})
      }
    } else if (key === 'stream') {
      if (roleTypeTemp === 'admin') {
        onLoadAdminSingleStream(projectId, () => {})
      } else if (roleTypeTemp === 'user') {
        onLoadUserStreams(projectId, () => {})
      }
    } else if (key === 'namespace') {
      if (roleTypeTemp === 'admin') {
        onLoadSelectNamespaces(projectId, () => {})
      } else if (roleTypeTemp === 'user') {
        onLoadUserNamespaces(projectId, () => {})
      }
    } else if (key === 'user') {
      if (roleTypeTemp === 'admin') {
        onLoadSelectUsers(projectId, () => {})
      } else if (roleTypeTemp === 'user') {
        onLoadUserUsers(projectId, () => {})
      }
    } else if (key === 'resource') {
      if (roleTypeTemp === 'admin') {
        onLoadResources(projectId, 'admin')
      } else if (roleTypeTemp === 'user') {
        onLoadResources(projectId, 'user')
      }
    } else if (key === 'udf') {
      if (roleTypeTemp === 'admin') {
        onLoadSingleUdf(projectId, 'admin', () => {})
      } else if (roleTypeTemp === 'user') {
        onLoadSingleUdf(projectId, 'user', () => {})
      }
    }

    this.setState({
      tabPanelKey: key
    })
  }

  /***
   * 新增Stream时，验证 stream name 是否存在
   * */
  onInitStreamNameValue = (value) => {
    this.props.onLoadStreamNameValue(this.state.projectId, value, () => {}, () => {
      this.workbenchStreamForm.setFields({
        streamName: {
          value: value,
          errors: [new Error('该 Name 已存在')]
        }
      })
    })
  }

  // hdfslog namespace
  initialHdfslogCascader = (value) => this.setState({ hdfslogSinkNsValue: value.join('.') })
  /**
   * 新增Flow时，获取 default type source namespace 下拉框
   * */
  onInitSourceTypeNamespace = (projectId, value, type) => {
    const { flowMode, pipelineStreamId } = this.state

    this.setState({ sourceTypeNamespaceData: [] })

    if (pipelineStreamId !== 0) {
      this.props.onLoadSourceSinkTypeNamespace(projectId, pipelineStreamId, value, type, (result) => {
        this.setState({
          sourceTypeNamespaceData: this.generateSourceSinkNamespaceHierarchy(value, result)
        })
        // default source ns 和 sink ns 同时调同一个接口获得，保证两处的 placeholder 和单条数据回显都能正常
        if (flowMode === 'add' || flowMode === 'copy') {
          this.workbenchFlowForm.setFieldsValue({
            sourceNamespace: undefined
          })
        }
      })
    }
  }
  /**
   * 新增Job时，获取 source namespace 下拉框数据
   * */
  onInitJobSourceNs = (projectId, value, type) => {
    const { jobMode } = this.state

    this.setState({ jobSourceNsData: [] })

    this.props.onLoadJobSourceNs(projectId, value, type, (result) => {
      this.setState({
        jobSourceNsData: this.generateSourceSinkNamespaceHierarchy(value, result)
      })
      if (jobMode === 'add') {
        this.workbenchJobForm.setFieldsValue({
          sourceNamespace: undefined
        })
      }
    }, (result) => {
      message.error(`Source 异常：${result}`, 5)
    })
  }

  /**
   * 新增Flow时，获取 hdfslog type source namespace 下拉框数据
   * */
  onInitHdfslogNamespace = (projectId, value, type) => {
    const { pipelineStreamId } = this.state

    this.setState({
      hdfslogSinkNsValue: '',
      hdfslogNsData: []
    })
    if (pipelineStreamId !== 0) {
      this.props.onLoadSourceSinkTypeNamespace(projectId, pipelineStreamId, value, type, (result) => {
        this.setState({
          hdfslogNsData: this.generateHdfslogNamespaceHierarchy(value, result),
          hdfslogSinkDataSysValue: value
        })
      })
    }
  }

  /**
   * 新增Flow时，获取 default type sink namespace 下拉框
   * */
  onInitSinkTypeNamespace = (projectId, value, type) => {
    const { flowMode, pipelineStreamId } = this.state

    this.setState({
      sinkTypeNamespaceData: [],
      sinkConfigMsg: this.showSinkConfigMsg(value)
    })
    if (pipelineStreamId !== 0) {
      this.props.onLoadSinkTypeNamespace(projectId, pipelineStreamId, value, type, (result) => {
        this.setState({
          sinkTypeNamespaceData: this.generateSourceSinkNamespaceHierarchy(value, result)
        })
        if (flowMode === 'add' || flowMode === 'copy') {
          this.workbenchFlowForm.setFieldsValue({
            sinkNamespace: undefined
          })
        }
      })
    }
  }

  /**
   * 新增Job时，获取 sink namespace 下拉框数据
   * */
  onInitJobSinkNs = (projectId, value, type) => {
    const { jobMode } = this.state

    this.setState({
      jobSinkNsData: [],
      jobSinkConfigMsg: this.showSinkConfigMsg(value)
    })
    this.props.onLoadJobSinkNs(projectId, value, type, (result) => {
      this.setState({
        jobSinkNsData: this.generateSourceSinkNamespaceHierarchy(value, result)
      })
      if (jobMode === 'add') {
        this.workbenchJobForm.setFieldsValue({
          sinkNamespace: undefined
        })
      }
    }, (result) => {
      message.error(`Sink 异常：${result}`, 5)
    })
  }

  showSinkConfigMsg (value) {
    let sinkConfigMsgTemp = ''
    if (value === 'cassandra') {
      sinkConfigMsgTemp = 'For example: {"mutation_type":"iud"}'
    } else if (value === 'mysql' || value === 'oracle' || value === 'postgresql') {
      sinkConfigMsgTemp = 'For example: {"mutation_type":"iud"}'
    } else if (value === 'es') {
      sinkConfigMsgTemp = 'For example: {"mutation_type":"iud", "_id": "id,name"}'
    } else if (value === 'hbase') {
      const temp = "'_'"
      sinkConfigMsgTemp = `For example: {"mutation_type":"iud","hbase.columnFamily":"cf","hbase.saveAsString": true, "hbase.rowKey":"hash(id1)+${temp}+value(id2)"}`
    } else if (value === 'mongodb') {
      sinkConfigMsgTemp = 'For example: {"mutation_type":"iud", "_id": "id,name"}'
    } else {
      sinkConfigMsgTemp = ''
    }
    return sinkConfigMsgTemp
  }

  /**
   * 新增Flow时，获取 default transformation sink namespace 下拉框
   * */
  onInitTransformSinkTypeNamespace = (projectId, value, type) => {
    const { pipelineStreamId } = this.state

    this.setState({ transformSinkTypeNamespaceData: [] })

    if (pipelineStreamId !== 0) {
      this.props.onLoadTranSinkTypeNamespace(projectId, this.state.pipelineStreamId, value, type, (result) => {
        this.setState({
          transformSinkNamespaceArray: result,
          transformSinkTypeNamespaceData: this.generateTransformSinkNamespaceHierarchy(value, result)
        })
      })
    }
  }

  /**
   * 生成 step1 的 Source/Sink Namespace Cascader 所需数据源
   */
  generateSourceSinkNamespaceHierarchy = (system, result) => {
    const snsHierarchy = []
    result.forEach(item => {
      if (item.nsSys === system) {
        let instance = snsHierarchy.find(i => i.value === item.nsInstance)
        if (!instance) {
          const newInstance = {
            value: item.nsInstance,
            label: item.nsInstance,
            children: []
          }
          snsHierarchy.push(newInstance)
          instance = newInstance
        }

        let database = instance.children.find(i => i.value === item.nsDatabase)
        if (!database) {
          const newDatabase = {
            value: item.nsDatabase,
            label: item.nsDatabase,
            children: []
          }
          instance.children.push(newDatabase)
          database = newDatabase
        }

        let table = database.children.find(i => i.value === item.nsTable)
        if (!table) {
          const newTable = {
            value: item.nsTable,
            label: item.nsTable
          }
          database.children.push(newTable)
        }
      }
    })
    return snsHierarchy
  }

  /**
   * 生成 step1 的 Hdfslog Source/Sink Namespace Cascader 所需数据源
   */
  generateHdfslogNamespaceHierarchy = (system, result) => {
    const snsHierarchy = result.length === 0
      ? []
      : [{
        value: '*',
        label: '*',
        children: [{
          value: '*',
          label: '*',
          children: [{
            value: '*',
            label: '*'
          }]
        }]
      }]

    result.forEach(item => {
      if (item.nsSys === system) {
        let instance = snsHierarchy.find(i => i.value === item.nsInstance)
        if (!instance) {
          const newInstance = {
            value: item.nsInstance,
            label: item.nsInstance,
            children: [{
              value: '*',
              label: '*',
              children: [{
                value: '*',
                label: '*'
              }]
            }]
          }
          snsHierarchy.push(newInstance)
          instance = newInstance
        }

        let database = instance.children.find(i => i.value === item.nsDatabase)
        if (!database) {
          const newDatabase = {
            value: item.nsDatabase,
            label: item.nsDatabase,
            children: [{
              value: '*',
              label: '*'
            }]
          }
          instance.children.push(newDatabase)
          database = newDatabase
        }

        let table = database.children.find(i => i.value === item.nsTable)
        if (!table) {
          const newTable = {
            value: item.nsTable,
            label: item.nsTable
          }
          database.children.push(newTable)
        }
      }
    })
    return snsHierarchy
  }

  /**
   * 生成 transformation 中 的 Sink Namespace Cascader 所需数据源
   */
  generateTransformSinkNamespaceHierarchy = (system, result) => {
    const snsHierarchy = []
    result.forEach(item => {
      if (item.nsSys === system) {
        let instance = snsHierarchy.find(i => i.value === item.nsInstance)
        if (!instance) {
          const newInstance = {
            value: item.nsInstance,
            label: item.nsInstance,
            children: []
          }
          snsHierarchy.push(newInstance)
          instance = newInstance
        }

        let database = instance.children.find(i => i.value === item.nsDatabase)
        if (!database) {
          const newDatabase = {
            value: item.nsDatabase,
            label: item.nsDatabase
            // children: []
          }
          instance.children.push(newDatabase)
          // database = newDatabase
        }

        // let permission = database.children.find(i => i.value === item.permission)
        // if (!permission) {
        //   const newPermission = {
        //     value: item.permission,
        //     label: item.permission
        //   }
        //   database.children.push(newPermission)
        // }
      }
    })
    return snsHierarchy
  }

  // 控制 result field show／hide
  initResultFieldClass = (e) => {
    if (e.target.value === 'selected') {
      this.setState({ fieldSelected: '' })
    } else if (e.target.value === 'all') {
      this.setState({ fieldSelected: 'hide' })
    }
  }

  // 控制 data frame number show／hide
  initDataShowClass = (e) => {
    if (e.target.value === 'true') {
      this.setState({ dataframeShowSelected: '' })
    } else {
      this.setState({ dataframeShowSelected: 'hide' })
    }
  }

  showAddFlowWorkbench = () => {
    this.workbenchFlowForm.resetFields()
    this.setState({
      flowMode: 'add',
      formStep: 0,
      flowFormTranTableSource: [],
      transformTagClassName: '',
      transformTableClassName: 'hide',
      transConnectClass: 'hide',
      fieldSelected: 'hide',
      etpStrategyCheck: false,
      dataframeShowSelected: 'hide',
      resultFieldsValue: 'all',
      etpStrategyConfirmValue: '',
      etpStrategyRequestValue: ''
    }, () => {
      this.workbenchFlowForm.setFieldsValue({
        resultFields: 'all',
        dataframeShow: 'false',
        dataframeShowNum: 10
      })
      this.onInitStreamTypeSelect('default')
    })
  }

  onInitStreamTypeSelect = (val) => {
    if (val === 'default') {
      this.setState({ streamDiffType: 'default' })
    } else if (val === 'hdfslog') {
      this.setState({ streamDiffType: 'hdfslog' })
    }

    // 显示 Stream 信息
    this.props.onLoadSelectStreamKafkaTopic(this.state.projectId, val, (result) => {
      const resultFinal = result.map(s => {
        const responseResult = Object.assign({}, s.stream, {
          disableActions: s.disableActions,
          topicInfo: s.topicInfo,
          instance: s.kafkaInfo.instance,
          connUrl: s.kafkaInfo.connUrl,
          projectName: s.projectName,
          currentUdf: s.currentUdf,
          usingUdf: s.usingUdf
        })
        responseResult.key = responseResult.id
        return responseResult
      })

      this.setState({
        selectStreamKafkaTopicValue: resultFinal,
        hdfslogSinkDataSysValue: '',
        hdfslogSinkNsValue: ''
      })
      if (result.length === 0) {
        message.warning('请先新建相应类型的 Stream！', 3)
        this.setState({
          pipelineStreamId: 0,
          flowKafkaInstanceValue: '',
          flowKafkaTopicValue: ''
        })
      } else {
        const topicTemp = resultFinal[0].topicInfo

        this.setState({
          pipelineStreamId: resultFinal[0].id,
          flowKafkaInstanceValue: resultFinal[0].instance,
          flowKafkaTopicValue: topicTemp.map(j => j.name).join(',')
        })
        this.workbenchFlowForm.setFieldsValue({
          flowStreamId: resultFinal[0].id,
          streamName: resultFinal[0].name
        })
      }
    })
    this.workbenchFlowForm.setFieldsValue({
      sourceDataSystem: '',
      hdfslogNamespace: undefined
    })
  }

  onInitStreamNameSelect = (valId) => {
    const { streamDiffType, selectStreamKafkaTopicValue } = this.state

    const selName = selectStreamKafkaTopicValue.find(s => s.id === Number(valId))
    const topicTemp = selName.topicInfo
    this.setState({
      pipelineStreamId: Number(valId),
      flowKafkaInstanceValue: selName.instance,
      flowKafkaTopicValue: topicTemp.map(j => j.name).join(',')
    })

    if (streamDiffType === 'default') {
      this.workbenchFlowForm.setFieldsValue({
        flowStreamId: Number(valId),
        sourceDataSystem: '',
        sinkDataSystem: '',
        sourceNamespace: undefined,
        sinkNamespace: undefined
      })
    } else if (streamDiffType === 'hdfslog') {
      this.setState({
        hdfslogSinkDataSysValue: '',
        hdfslogSinkNsValue: ''
      })
      this.workbenchFlowForm.setFieldsValue({
        sourceDataSystem: '',
        hdfslogNamespace: undefined
      })
    }
  }

  showCopyFlowWorkbench = (flow) => {
    this.setState({ flowMode: 'copy' })
    this.workbenchFlowForm.resetFields()
    this.queryFlowInfo(flow)
  }

  // YYYYMMDDHHmmss 转换成 YYYY-MM-DD HH:mm:ss, 再转成 YYYY/MM/DD HH:mm:ss
  formatString (dateString) {
    let dateTemp = ''

    dateTemp += `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)} ${dateString.slice(8, 10)}:${dateString.slice(10, 12)}:${dateString.slice(12)}`

    dateTemp = dateTemp.replace(new RegExp('-', 'gm'), '/')
    const dateTempHaoMiao = (new Date(dateTemp)).getTime()
    return dateTempHaoMiao
  }

  showEditJobWorkbench = (job) => () => {
    this.setState({
      jobMode: 'edit'
      // sparkConfigCheck: true
    })

    new Promise((resolve) => {
      const requestData = {
        projectId: job.projectId,
        jobId: job.id
      }
      this.props.onQueryJob(requestData, (result) => {
        const resultFinal = result.job
        resolve(resultFinal)

        this.workbenchJobForm.setFieldsValue({
          jobName: resultFinal.name,
          type: resultFinal.sourceType,
          eventStartTs: resultFinal.eventTsStart === '' ? null : Moment(this.formatString(resultFinal.eventTsStart)),
          eventEndTs: resultFinal.eventTsEnd === '' ? null : Moment(this.formatString(resultFinal.eventTsEnd))
        })

        this.setState({
          formStep: 0,
          jobSparkConfigValues: {
            sparkConfig: resultFinal.sparkConfig,
            startConfig: resultFinal.startConfig
          },
          singleJobResult: {
            id: resultFinal.id,
            name: resultFinal.name,
            projectId: resultFinal.projectId,
            sourceNs: resultFinal.sourceNs,
            sinkNs: resultFinal.sinkNs,
            sourceType: resultFinal.sourceType,
            sourceConfig: resultFinal.sourceConfig,
            sparkAppid: resultFinal.sparkAppid,
            logPath: resultFinal.logPath,
            startedTime: resultFinal.startedTime,
            stoppedTime: resultFinal.stoppedTime,
            status: resultFinal.status,
            createTime: resultFinal.createTime,
            createBy: resultFinal.createBy,
            updateTime: resultFinal.updateTime,
            updateBy: resultFinal.updateBy
          }
        })
      })
    })
      .then((resultFinal) => {
        if (resultFinal.tranConfig !== '') {
          if (resultFinal.tranConfig.indexOf('action') > -1) {
            const tranConfigVal = JSON.parse(JSON.parse(JSON.stringify(resultFinal.tranConfig)))

            const tranActionArr = tranConfigVal.action.split(';')
            tranActionArr.splice(tranActionArr.length - 1, 1)

            this.state.jobFormTranTableSource = tranActionArr.map((i, index) => {
              const tranTableSourceTemp = {}
              let tranConfigInfoTemp = ''
              let tranTypeTepm = ''

              if (i.indexOf('spark_sql') > -1) {
                const sparkAfterPart = i.substring(i.indexOf('=') + 1)
                const sparkAfterPartTepm = sparkAfterPart.replace(/(^\s*)|(\s*$)/g, '')

                tranConfigInfoTemp = sparkAfterPartTepm
                tranTypeTepm = 'sparkSql'
              }

              if (i.indexOf('custom_class') > -1) {
                const sparkAfterPart = i.substring(i.indexOf('=') + 1)
                const sparkAfterPartTepm = sparkAfterPart.replace(/(^\s*)|(\s*$)/g, '')

                tranConfigInfoTemp = sparkAfterPartTepm
                tranTypeTepm = 'transformClassName'
              }

              tranTableSourceTemp.order = index + 1
              tranTableSourceTemp.transformConfigInfo = `${tranConfigInfoTemp};`
              tranTableSourceTemp.transformConfigInfoRequest = `${i};`
              tranTableSourceTemp.transformType = tranTypeTepm
              return tranTableSourceTemp
            })

            this.setState({
              jobTranTagClassName: 'hide',
              jobTranTableClassName: ''
            })
          } else {
            this.setState({
              jobTranTagClassName: '',
              jobTranTableClassName: 'hide'
            })
          }
        } else {
          this.setState({
            jobTranTagClassName: '',
            jobTranTableClassName: 'hide'
          })
        }

        let sinkConfigShow = ''
        let maxRecordShow = 5000
        let resultFieldsVal = ''
        if (resultFinal.sinkConfig !== '') {
          const sinkConfigVal = JSON.parse(JSON.parse(JSON.stringify(resultFinal.sinkConfig)))
          sinkConfigShow = sinkConfigVal.sink_specific_config ? JSON.stringify(sinkConfigVal.sink_specific_config) : ''
          maxRecordShow = sinkConfigVal.maxRecordPerPartitionProcessed ? sinkConfigVal.maxRecordPerPartitionProcessed : 5000

          if (resultFinal.sinkConfig.indexOf('output') < 0) {
            resultFieldsVal = 'all'
            this.setState({
              fieldSelected: 'hide'
            }, () => {
              this.workbenchJobForm.setFieldsValue({
                resultFieldsSelected: '',
                resultFields: 'all'
              })
            })
          } else {
            resultFieldsVal = 'selected'
            this.setState({
              fieldSelected: ''
            }, () => {
              this.workbenchJobForm.setFieldsValue({
                resultFieldsSelected: sinkConfigVal.sink_output,
                resultFields: 'selected'
              })
            })
          }
        } else {
          sinkConfigShow = ''
          maxRecordShow = 5000
          resultFieldsVal = 'all'
          this.setState({
            fieldSelected: 'hide'
          }, () => {
            this.workbenchJobForm.setFieldsValue({
              resultFieldsSelected: '',
              resultFields: 'all'
            })
          })
        }

        const sourceNsArr = resultFinal.sourceNs.split('.')
        const sinkNsArr = resultFinal.sinkNs.split('.')

        this.workbenchJobForm.setFieldsValue({
          sourceDataSystem: sourceNsArr[0],
          sourceNamespace: [sourceNsArr[1], sourceNsArr[2], sourceNsArr[3]],
          sinkDataSystem: sinkNsArr[0],
          sinkNamespace: [sinkNsArr[1], sinkNsArr[2], sinkNsArr[3]],

          sinkConfig: sinkConfigShow,
          maxRecordPerPartitionProcessed: maxRecordShow,
          resultFields: resultFieldsVal
        })
      })
  }

  showEditFlowWorkbench = (flow) => () => {
    this.setState({ flowMode: 'edit' })

    new Promise((resolve) => {
      resolve(flow)
      this.workbenchFlowForm.resetFields()
    })
      .then((flow) => {
        this.queryFlowInfo(flow)
      })
  }

  /**
   *  Flow 调单条查询的接口，回显数据
   * */
  queryFlowInfo = (flow) => {
    this.setState({
      streamDiffType: flow.streamType
    }, () => {
      if (flow.streamType === 'default') {
        this.queryFlowDefault(flow)
      } else if (flow.streamType === 'hdfslog') {
        this.queryFlowHdfslog(flow)
      }
    })
  }

  queryFlowDefault (flow) {
    new Promise((resolve) => {
      const requestData = {
        projectId: flow.projectId,
        streamId: flow.streamId,
        id: flow.id
      }
      this.props.onQueryFlow(requestData, (result) => {
        resolve(result)

        this.workbenchFlowForm.setFieldsValue({
          flowStreamId: result.streamId,
          streamName: result.streamName,
          streamType: result.streamType,
          protocol: result.consumedProtocol
        })

        this.setState({
          formStep: 0,
          pipelineStreamId: result.streamId,
          flowKafkaInstanceValue: result.kafka,
          flowKafkaTopicValue: result.topics,
          singleFlowResult: {
            id: result.id,
            projectId: result.projectId,
            streamId: result.streamId,
            sourceNs: result.sourceNs,
            sinkNs: result.sinkNs,
            status: result.status,
            active: result.active,
            createTime: result.createTime,
            createBy: result.createBy,
            updateTime: result.updateTime,
            updateBy: result.updateBy
          }
        })
      })
    })
      .then((result) => {
        const sourceNsArr = result.sourceNs.split('.')
        const sinkNsArr = result.sinkNs.split('.')

        let dataframeShowVal = ''

        if (result.tranConfig !== '') {
          if (result.tranConfig.indexOf('action') > -1) {
            const temp = JSON.parse(JSON.stringify(result.tranConfig))

            const tt = temp.replace(/\n/g, ' ')
            const tranConfigVal = JSON.parse(tt)

            let validityTemp = tranConfigVal.validity

            if (result.tranConfig.indexOf('validity') > -1) {
              const requestTempJson = {
                check_columns: validityTemp.check_columns,
                check_rule: validityTemp.check_rule,
                rule_mode: validityTemp.rule_mode,
                rule_params: validityTemp.rule_params,
                against_action: validityTemp.against_action
              }

              this.setState({
                etpStrategyCheck: true,
                etpStrategyResponseValue: validityTemp,
                etpStrategyRequestValue: `"validity":${JSON.stringify(requestTempJson)}`,
                etpStrategyConfirmValue: JSON.stringify(requestTempJson)
              })
            } else {
              this.setState({
                etpStrategyCheck: false,
                etpStrategyResponseValue: ''
              })
            }

            if (result.tranConfig.indexOf('dataframe_show_num') > 0) {
              dataframeShowVal = 'true'
              this.setState({
                dataframeShowSelected: ''
              }, () => {
                this.workbenchFlowForm.setFieldsValue({
                  dataframeShowNum: tranConfigVal.dataframe_show_num
                })
              })
            } else {
              dataframeShowVal = 'false'
              this.setState({
                dataframeShowSelected: 'hide'
              })
              this.workbenchFlowForm.setFieldsValue({
                dataframeShow: 'false',
                dataframeShowNum: 10
              })
            }

            const tranActionArr = tranConfigVal.action.split(';')
            tranActionArr.splice(tranActionArr.length - 1, 1)

            this.state.flowFormTranTableSource = tranActionArr.map((i, index) => {
              const tranTableSourceTemp = {}
              let tranConfigInfoTemp = ''
              let tranConfigInfoSqlTemp = ''
              let tranTypeTepm = ''
              let pushdownConTepm = ''

              if (i.indexOf('pushdown_sql') > -1) {
                const iTmp = i.indexOf('left join') > -1 ? i.replace('left join', 'leftJoin') : i
                const lookupBeforePart = iTmp.substring(0, i.indexOf('=') - 1)
                const lookupAfterPart = iTmp.substring(i.indexOf('=') + 1)
                const lookupBeforePartTemp = (lookupBeforePart.replace(/(^\s*)|(\s*$)/g, '')).split(' ')
                const lookupAfterPartTepmTemp = lookupAfterPart.replace(/(^\s*)|(\s*$)/g, '') // 去字符串前后的空白；sql语句回显
                const lookupAfterPartTepm = preProcessSql(lookupAfterPartTepmTemp)

                tranConfigInfoTemp = [lookupBeforePartTemp[1], lookupBeforePartTemp[3], lookupAfterPartTepm].join('.')
                tranConfigInfoSqlTemp = lookupAfterPartTepm
                tranTypeTepm = 'lookupSql'

                const tmpObj = tranConfigVal.pushdown_connection.find(g => g.name_space === lookupBeforePartTemp[3])

                const pushdownConTepmJson = {
                  name_space: tmpObj.name_space,
                  jdbc_url: tmpObj.jdbc_url,
                  username: tmpObj.username,
                  password: tmpObj.password
                }
                pushdownConTepm = JSON.stringify(pushdownConTepmJson)
              }

              if (i.indexOf('parquet_sql') > -1) {
                let imp = ''
                if (i.indexOf('left join') > 0) {
                  imp = i.replace('left join', 'leftJoin')
                } else if (i.indexOf('inner join') > 0) {
                  imp = i.replace('inner join', 'innerJoin')
                } else {
                  imp = i
                }

                const streamJoinBeforePart = imp.substring(0, i.indexOf('=') - 1)
                const streamJoinAfterPart = imp.substring(i.indexOf('=') + 1)
                const streamJoinBeforePartTemp = streamJoinBeforePart.replace(/(^\s*)|(\s*$)/g, '').split(' ')
                const streamJoinAfterPartTepmTemp = streamJoinAfterPart.replace(/(^\s*)|(\s*$)/g, '')
                const streamJoinAfterPartTepm = preProcessSql(streamJoinAfterPartTepmTemp)

                const iTemp3Temp = streamJoinBeforePartTemp[3].substring(streamJoinBeforePartTemp[3].indexOf('(') + 1)
                const iTemp3Val = iTemp3Temp.substring(0, iTemp3Temp.indexOf(')'))
                tranConfigInfoTemp = [streamJoinBeforePartTemp[1], iTemp3Val, streamJoinAfterPartTepm].join('.')
                tranConfigInfoSqlTemp = streamJoinAfterPartTepm
                tranTypeTepm = 'streamJoinSql'
                pushdownConTepm = ''
              }

              if (i.indexOf('spark_sql') > -1) {
                const sparkAfterPart = i.substring(i.indexOf('=') + 1)
                const sparkAfterPartTepmTemp = sparkAfterPart.replace(/(^\s*)|(\s*$)/g, '')
                const sparkAfterPartTepm = preProcessSql(sparkAfterPartTepmTemp)

                tranConfigInfoTemp = sparkAfterPartTepm
                tranConfigInfoSqlTemp = sparkAfterPartTepm
                tranTypeTepm = 'sparkSql'
                pushdownConTepm = ''
              }

              if (i.indexOf('custom_class') > -1) {
                const classAfterPart = i.substring(i.indexOf('=') + 1)
                const classAfterPartTepmTemp = classAfterPart.replace(/(^\s*)|(\s*$)/g, '')
                const classAfterPartTepm = preProcessSql(classAfterPartTepmTemp)

                tranConfigInfoTemp = classAfterPartTepm
                tranConfigInfoSqlTemp = classAfterPartTepm
                tranTypeTepm = 'transformClassName'
                pushdownConTepm = ''
              }

              tranTableSourceTemp.order = index + 1
              tranTableSourceTemp.transformConfigInfo = `${tranConfigInfoTemp};`
              tranTableSourceTemp.tranConfigInfoSql = tranConfigInfoSqlTemp
              tranTableSourceTemp.transformConfigInfoRequest = `${i};`
              tranTableSourceTemp.transformType = tranTypeTepm
              tranTableSourceTemp.pushdownConnection = pushdownConTepm
              return tranTableSourceTemp
            })

            this.setState({
              transformTagClassName: 'hide',
              transformTableClassName: '',
              transConnectClass: ''
            })
          } else {
            this.setState({
              transformTagClassName: '',
              transformTableClassName: 'hide',
              transConnectClass: 'hide',
              etpStrategyCheck: false,
              dataframeShowSelected: 'hide'
            })
          }
        } else {
          this.setState({
            transformTagClassName: '',
            transformTableClassName: 'hide',
            transConnectClass: 'hide',
            etpStrategyCheck: false,
            dataframeShowSelected: 'hide'
          })
        }

        let sinkConfigShow = ''
        let resultFieldsVal = ''
        if (result.sinkConfig !== '') {
          const sinkConfigVal = JSON.parse(JSON.parse(JSON.stringify(result.sinkConfig)))
          sinkConfigShow = sinkConfigVal.sink_specific_config ? JSON.stringify(sinkConfigVal.sink_specific_config) : ''

          if (result.sinkConfig.indexOf('output') < 0) {
            resultFieldsVal = 'all'
            this.setState({
              fieldSelected: 'hide'
            }, () => {
              this.workbenchFlowForm.setFieldsValue({
                resultFieldsSelected: '',
                resultFields: 'all'
              })
            })
          } else {
            resultFieldsVal = 'selected'
            this.setState({
              fieldSelected: ''
            }, () => {
              this.workbenchFlowForm.setFieldsValue({
                resultFieldsSelected: sinkConfigVal.sink_output,
                resultFields: 'selected'
              })
            })
          }
        } else {
          sinkConfigShow = ''
          resultFieldsVal = 'all'
          this.setState({
            fieldSelected: 'hide'
          }, () => {
            this.workbenchFlowForm.setFieldsValue({
              resultFieldsSelected: '',
              resultFields: 'all'
            })
          })
        }

        this.workbenchFlowForm.setFieldsValue({
          sourceDataSystem: sourceNsArr[0],
          sourceNamespace: [sourceNsArr[1], sourceNsArr[2], sourceNsArr[3]],
          sinkDataSystem: sinkNsArr[0],
          sinkNamespace: [sinkNsArr[1], sinkNsArr[2], sinkNsArr[3]],

          sinkConfig: this.state.flowMode === 'copy' ? '' : sinkConfigShow,
          resultFields: resultFieldsVal,
          dataframeShow: dataframeShowVal
        })
      })
  }

  queryFlowHdfslog (flow) {
    new Promise((resolve) => {
      const requestData = {
        projectId: flow.projectId,
        streamId: flow.streamId,
        id: flow.id
      }
      this.props.onQueryFlow(requestData, (result) => {
        resolve(result)

        this.workbenchFlowForm.setFieldsValue({
          flowStreamId: result.streamId,
          streamName: result.streamName,
          streamType: result.streamType
        })

        this.setState({
          formStep: 0,
          pipelineStreamId: result.streamId,
          hdfslogSinkNsValue: this.state.flowMode === 'copy' ? '' : result.sinkNs,
          flowKafkaInstanceValue: result.kafka,
          flowKafkaTopicValue: result.topics,
          singleFlowResult: {
            id: result.id,
            projectId: result.projectId,
            streamId: result.streamId,
            sourceNs: result.sourceNs,
            sinkNs: result.sinkNs,
            status: result.status,
            active: result.active,
            createTime: result.createTime,
            createBy: result.createBy,
            updateTime: result.updateTime,
            updateBy: result.updateBy
          }
        })
      })
    })
      .then((result) => {
        const sourceNsArr = result.sourceNs.split('.')

        this.workbenchFlowForm.setFieldsValue({
          sourceDataSystem: sourceNsArr[0],
          hdfslogNamespace: [
            sourceNsArr[1],
            sourceNsArr[2],
            sourceNsArr[3]
          ],
          sinkConfig: result.sinkConfig
        })
      })
  }

  showAddStreamWorkbench = () => {
    this.workbenchStreamForm.resetFields()
    // 显示 jvm 数据，从而获得初始的 sparkConfig
    this.setState({
      streamMode: 'add',
      streamConfigCheck: false
    })

    this.props.onLoadStreamConfigJvm((result) => {
      const othersInit = 'spark.locality.wait=10ms,spark.shuffle.spill.compress=false,spark.io.compression.codec=org.apache.spark.io.SnappyCompressionCodec,spark.streaming.stopGracefullyOnShutdown=true,spark.scheduler.listenerbus.eventqueue.size=1000000,spark.sql.ui.retainedExecutions=3'

      const startConfigJson = {
        driverCores: 1,
        driverMemory: 2,
        executorNums: 6,
        perExecutorMemory: 2,
        perExecutorCores: 1
      }
      const launchConfigJson = {
        durations: 10,
        partitions: 6,
        maxRecords: 50
      }

      this.setState({
        streamConfigValues: {
          sparkConfig: `${result},${othersInit}`,
          startConfig: `${JSON.stringify(startConfigJson)}`,
          launchConfig: `${JSON.stringify(launchConfigJson)}`
        }
      })
    })

    // 显示 Kafka
    this.props.onLoadkafka(this.state.projectId, 'kafka', (result) => {
      this.setState({ kafkaValues: result })
    })
  }

  showEditStreamWorkbench = (stream) => () => {
    this.setState({
      streamMode: 'edit',
      streamConfigCheck: true
    })
    this.workbenchStreamForm.resetFields()

    this.props.onLoadStreamDetail(this.state.projectId, stream.id, 'user', (result) => {
      const resultVal = Object.assign({}, result.stream, {
        disableActions: result.disableActions,
        topicInfo: result.topicInfo,
        instance: result.kafkaInfo.instance,
        connUrl: result.kafkaInfo.connUrl,
        projectName: result.projectName,
        currentUdf: result.currentUdf,
        usingUdf: result.usingUdf
      })

      this.workbenchStreamForm.setFieldsValue({
        streamName: resultVal.name,
        type: resultVal.streamType,
        desc: resultVal.desc,
        kafka: resultVal.instance
      })

      this.setState({
        streamConfigValues: {
          sparkConfig: resultVal.sparkConfig,
          startConfig: resultVal.startConfig,
          launchConfig: resultVal.launchConfig
        },

        streamQueryValues: {
          id: resultVal.id,
          projectId: resultVal.projectId
        }
      })
    })
  }

  /**
   * Stream Config Modal
   * */
  onShowConfigModal = () => {
    const { streamConfigValues } = this.state
    this.setState({
      streamConfigModalVisible: true
    }, () => {
      // 点击 config 按钮时，回显数据。 有且只有2条 jvm 配置
      const streamConArr = streamConfigValues.sparkConfig.split(',')

      const tempJvmArr = []
      const tempOthersArr = []
      for (let i = 0; i < streamConArr.length; i++) {
        // 是否是 jvm
        streamConArr[i].indexOf('extraJavaOptions') > -1 ? tempJvmArr.push(streamConArr[i]) : tempOthersArr.push(streamConArr[i])
      }

      const jvmTempValue = tempJvmArr.join('\n')
      const personalConfTempValue = tempOthersArr.join('\n')

      const startConfigTemp = JSON.parse(streamConfigValues.startConfig)
      const launchConfigTemp = JSON.parse(streamConfigValues.launchConfig)

      this.streamConfigForm.setFieldsValue({
        jvm: jvmTempValue,
        driverCores: startConfigTemp.driverCores,
        driverMemory: startConfigTemp.driverMemory,
        executorNums: startConfigTemp.executorNums,
        perExecutorCores: startConfigTemp.perExecutorCores,
        perExecutorMemory: startConfigTemp.perExecutorMemory,
        durations: launchConfigTemp.durations,
        partitions: launchConfigTemp.partitions,
        maxRecords: launchConfigTemp.maxRecords,
        personalConf: personalConfTempValue
      })
    })
  }

  /**
   * Spark Config Modal
   * */
  onShowSparkConfigModal = () => {
    const { jobSparkConfigValues } = this.state
    this.setState({
      sparkConfigModalVisible: true
    }, () => {
      const sparkConArr = jobSparkConfigValues.sparkConfig.split(',')

      const jobTempJvmArr = []
      const jobTempOthersArr = []
      for (let i = 0; i < sparkConArr.length; i++) {
        sparkConArr[i].indexOf('extraJavaOptions') > -1 ? jobTempJvmArr.push(sparkConArr[i]) : jobTempOthersArr.push(sparkConArr[i])
      }

      const jvmTempValue = jobTempJvmArr.join('\n')
      const personalConfTempValue = jobTempOthersArr.join('\n')
      const startConfigTemp = JSON.parse(jobSparkConfigValues.startConfig)

      this.streamConfigForm.setFieldsValue({
        jvm: jvmTempValue,
        driverCores: startConfigTemp.driverCores,
        driverMemory: startConfigTemp.driverMemory,
        executorNums: startConfigTemp.executorNums,
        perExecutorCores: startConfigTemp.perExecutorCores,
        perExecutorMemory: startConfigTemp.perExecutorMemory,
        personalConf: personalConfTempValue
      })
    })
  }

  hideConfigModal = () => {
    this.streamConfigForm.resetFields()
    this.setState({ streamConfigModalVisible: false })
  }
  hideSparkConfigModal = () => {
    this.streamConfigForm.resetFields()
    this.setState({ sparkConfigModalVisible: false })
  }

  onConfigModalOk = () => {
    this.streamConfigForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        values.personalConf = values.personalConf.trim()
        values.jvm = values.jvm.trim()

        const nJvm = (values.jvm.split('extraJavaOptions')).length - 1
        let jvmValTemp = ''
        if (nJvm === 2) {
          jvmValTemp = values.jvm.replace(/\n/g, ',')

          let sparkConfigValue = ''
          if (values.personalConf === undefined || values.personalConf === '') {
            sparkConfigValue = jvmValTemp
          } else {
            const nOthers = (values.jvm.split('=')).length - 1

            let personalConfTemp = ''
            if (nOthers === 1) {
              personalConfTemp = values.personalConf
            } else {
              personalConfTemp = values.personalConf.replace(/\n/g, ',')
            }
            sparkConfigValue = `${jvmValTemp},${personalConfTemp}`
          }

          const startConfigJson = {
            driverCores: values.driverCores,
            driverMemory: values.driverMemory,
            executorNums: values.executorNums,
            perExecutorMemory: values.perExecutorMemory,
            perExecutorCores: values.perExecutorCores
          }

          const launchConfigJson = {
            durations: values.durations,
            partitions: values.partitions,
            maxRecords: values.maxRecords
          }

          this.setState({
            streamConfigCheck: true,
            streamConfigValues: {
              sparkConfig: sparkConfigValue,
              startConfig: JSON.stringify(startConfigJson),
              launchConfig: JSON.stringify(launchConfigJson)
            }
          })
          this.hideConfigModal()
        } else {
          message.warning('请正确配置 JVM！', 3)
        }
      }
    })
  }

  onSparkConfigModalOk = () => {
    this.streamConfigForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        values.personalConf = values.personalConf.trim()
        values.jvm = values.jvm.trim()

        const nJvm = (values.jvm.split('extraJavaOptions')).length - 1
        let jvmValTemp = ''
        if (nJvm === 2) {
          jvmValTemp = values.jvm.replace(/\n/g, ',')

          let sparkConfigVal = ''
          if (values.personalConf === undefined || values.personalConf === '') {
            sparkConfigVal = jvmValTemp
          } else {
            const nOthers = (values.jvm.split('=')).length - 1

            let personalConfTemp = ''
            if (nOthers === 1) {
              personalConfTemp = values.personalConf
            } else {
              personalConfTemp = values.personalConf.replace(/\n/g, ',')
            }
            sparkConfigVal = `${jvmValTemp},${personalConfTemp}`
          }

          const startConfigJson = {
            driverCores: values.driverCores,
            driverMemory: values.driverMemory,
            executorNums: values.executorNums,
            perExecutorMemory: values.perExecutorMemory,
            perExecutorCores: values.perExecutorCores
          }

          this.setState({
            sparkConfigCheck: true,
            jobSparkConfigValues: {
              sparkConfig: sparkConfigVal,
              startConfig: JSON.stringify(startConfigJson)
            }
          })
          this.hideSparkConfigModal()
        } else {
          message.warning('请正确配置 JVM！', 3)
        }
      }
    })
  }

  hideFlowWorkbench = () => this.setState({ flowMode: '' })
  hideStreamWorkbench = () => this.setState({ streamMode: '' })
  hideJobWorkbench = () => this.setState({ jobMode: '' })

  /**
   *  JSON 格式校验
   *  如果JSON.parse能转换成功；并且字符串中包含 { 时，那么该字符串就是JSON格式的字符串。
   *  另：sink config 可为空
   */
  isJSON (str) {
    if (typeof str === 'string') {
      if (str === '') {
        return true
      } else {
        try {
          JSON.parse(str)
          if (str.indexOf('{') > -1) {
            return true
          } else {
            return false
          }
        } catch (e) {
          return false
        }
      }
    }
    return false
  }

  forwardStep = () => {
    const { tabPanelKey, streamDiffType } = this.state

    if (tabPanelKey === 'flow') {
      if (streamDiffType === 'default') {
        this.handleForwardDefault()
      } else if (streamDiffType === 'hdfslog') {
        this.handleForwardHdfslog()
      }
    } else if (tabPanelKey === 'job') {
      this.handleForwardJob()
    }
  }

  loadSTSExit (values) {
    const { flowMode } = this.state

    if (flowMode === 'add' || flowMode === 'copy') {
      // 新增flow时验证source to sink 是否存在
      const sourceInfo = [values.sourceDataSystem, values.sourceNamespace[0], values.sourceNamespace[1], values.sourceNamespace[2], '*', '*', '*'].join('.')
      const sinkInfo = [values.sinkDataSystem, values.sinkNamespace[0], values.sinkNamespace[1], values.sinkNamespace[2], '*', '*', '*'].join('.')

      this.props.onLoadSourceToSinkExist(this.state.projectId, sourceInfo, sinkInfo, () => {
        this.setState({
          formStep: this.state.formStep + 1,
          step2SourceNamespace: [values.sourceDataSystem, values.sourceNamespace.join('.')].join('.'),
          step2SinkNamespace: [values.sinkDataSystem, values.sinkNamespace.join('.')].join('.')
        })
      }, () => {
        message.error('Source to Sink 已存在！', 3)
      })
    } else if (flowMode === 'edit') {
      this.setState({
        formStep: this.state.formStep + 1,
        step2SourceNamespace: [values.sourceDataSystem, values.sourceNamespace.join('.')].join('.'),
        step2SinkNamespace: [values.sinkDataSystem, values.sinkNamespace.join('.')].join('.')
      })
    }
  }

  handleForwardDefault () {
    const { flowFormTranTableSource, streamDiffType } = this.state

    let tranRequestTempArr = []
    flowFormTranTableSource.map(i => tranRequestTempArr.push(preProcessSql(i.transformConfigInfoRequest)))
    const tranRequestTempString = tranRequestTempArr.join('')
    this.setState({ //
      transformTableRequestValue: tranRequestTempString === '' ? '' : `"action": "${tranRequestTempString}"`,
      transformTableConfirmValue: tranRequestTempString === '' ? '' : `"${tranRequestTempString}"`
    })

    // 只有 lookup sql 才有 pushdownConnection
    let tempSource = flowFormTranTableSource.filter(s => s.pushdownConnection !== '')

    let pushConnTemp = []
    for (let i = 0; i < tempSource.length; i++) {
      pushConnTemp.push(tempSource[i].pushdownConnection)
    }

    this.setState({
      pushdownConnectRequestValue: pushConnTemp === '' ? '' : `"pushdown_connection":[${pushConnTemp}],`
    })

    this.workbenchFlowForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        switch (this.state.formStep) {
          case 0:
            const values = this.workbenchFlowForm.getFieldsValue()
            if (values.sinkConfig === undefined || values.sinkConfig === '') {
              // 是否是 hbase/mysql/oracle.postgresql
              if (values.sinkDataSystem === 'hbase' || values.sinkDataSystem === 'postgresql') {
                message.error(`Data System 为 ${values.sinkDataSystem} 时，Sink Config 不能为空！`, 3)
              } else {
                this.loadSTSExit(values)
              }
            } else {
              // json 校验
              if (this.isJSON(values.sinkConfig) === false) {
                message.error('Sink Config 应为 JSON格式！', 3)
                return
              } else {
                this.loadSTSExit(values)
              }
            }

            const rfSelect = this.workbenchFlowForm.getFieldValue('resultFields')
            if (rfSelect === 'all') {
              this.setState({
                resultFiledsOutput: {},
                resultFieldsValue: 'all'
              })
            } else if (rfSelect === 'selected') {
              const rfSelectSelected = this.workbenchFlowForm.getFieldValue('resultFieldsSelected')
              this.setState({
                resultFiledsOutput: { sink_output: rfSelectSelected },
                resultFieldsValue: rfSelectSelected
              })
            }
            break
          case 1:
            if (streamDiffType === 'default') {
              const dataframeShowSelect = this.workbenchFlowForm.getFieldValue('dataframeShow')
              if (dataframeShowSelect === 'true') {
                const dataframeShowNum = this.workbenchFlowForm.getFieldValue('dataframeShowNum')
                this.setState({
                  dataframeShowOrNot: `"dataframe_show":"true","dataframe_show_num":"${dataframeShowNum}","swifts_specific_config":""`,
                  dataframeShowNumValue: `true; Number is ${dataframeShowNum}`
                })
              } else {
                this.setState({
                  dataframeShowOrNot: `"dataframe_show":"false","swifts_specific_config":""`,
                  dataframeShowNumValue: 'false'
                })
              }
              this.setState({
                formStep: this.state.formStep + 1
              })
            } else if (streamDiffType === 'hdfslog') {
              this.setState({
                formStep: this.state.formStep + 2
              })
            }
            break
        }
      }
    })
  }

  handleForwardHdfslog () {
    const { flowMode, projectId } = this.state

    this.workbenchFlowForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        if (flowMode === 'add' || flowMode === 'copy') {
          // 新增flow时验证source to sink 是否存在
          const sourceInfo = [values.sourceDataSystem, values.hdfslogNamespace[0], values.hdfslogNamespace[1], values.hdfslogNamespace[2], '*', '*', '*'].join('.')
          const sinkInfo = sourceInfo
          this.props.onLoadSourceToSinkExist(projectId, sourceInfo, sinkInfo, () => {
            this.setState({ formStep: this.state.formStep + 2 })
          }, () => {
            message.error('Source to Sink 已存在！', 3)
          })
        } else if (flowMode === 'edit') {
          this.setState({ formStep: this.state.formStep + 2 })
        }
      }
    })
  }

  loadJobSTSExit (values) {
    const { jobMode, formStep, projectId } = this.state

    if (jobMode === 'add') {
      // 新增 Job 时验证 source to sink 是否存在
      const sourceInfo = [values.sourceDataSystem, values.sourceNamespace[0], values.sourceNamespace[1], values.sourceNamespace[2], '*', '*', '*'].join('.')
      const sinkInfo = [values.sinkDataSystem, values.sinkNamespace[0], values.sinkNamespace[1], values.sinkNamespace[2], '*', '*', '*'].join('.')

      this.props.onLoadJobSourceToSinkExist(projectId, sourceInfo, sinkInfo, () => {
        this.setState({
          formStep: formStep + 1,
          jobStepSourceNs: [values.sourceDataSystem, values.sourceNamespace.join('.')].join('.'),
          jobStepSinkNs: [values.sinkDataSystem, values.sinkNamespace.join('.')].join('.')
        })
      }, () => {
        message.error('Source to Sink 已存在！', 3)
      })
    } else if (jobMode === 'edit') {
      this.setState({
        formStep: formStep + 1,
        jobStepSourceNs: [values.sourceDataSystem, values.sourceNamespace.join('.')].join('.'),
        jobStepSinkNs: [values.sinkDataSystem, values.sinkNamespace.join('.')].join('.')
      })
    }
  }

  handleForwardJob () {
    const { formStep, jobFormTranTableSource } = this.state
    const { jobNameExited } = this.props

    this.workbenchJobForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        switch (formStep) {
          case 0:
            if (jobNameExited) {
              this.workbenchJobForm.setFields({
                jobName: {
                  value: values.jobName,
                  errors: [new Error('该 Name 已存在')]
                }
              })
              message.error('该 Job Name 已存在！', 3)
            } else {
              if (values.sinkConfig === undefined || values.sinkConfig === '') {
                if (values.sinkDataSystem === 'hbase' || values.sinkDataSystem === 'postgresql') {
                  message.error(`Data System 为 ${values.sinkDataSystem} 时，Sink Config 不能为空！`, 3)
                } else {
                  this.loadJobSTSExit(values)
                }
              } else {
                if (this.isJSON(values.sinkConfig) === false) {
                  message.error('Sink Config 应为 JSON格式！', 3)
                  return
                } else {
                  this.loadJobSTSExit(values)
                }
              }
            }

            const rfSelect = this.workbenchJobForm.getFieldValue('resultFields')
            if (rfSelect === 'all') {
              this.setState({
                jobResultFiledsOutput: {},
                jobResultFieldsValue: 'all'
              })
            } else if (rfSelect === 'selected') {
              const rfSelectSelected = this.workbenchJobForm.getFieldValue('resultFieldsSelected')
              this.setState({
                jobResultFiledsOutput: { sink_output: rfSelectSelected },
                jobResultFieldsValue: rfSelectSelected
              })
            }
            break
          case 1:
            let tranRequestTempArr = []
            jobFormTranTableSource.map(i => tranRequestTempArr.push(i.transformConfigInfoRequest))
            const tranRequestTempString = tranRequestTempArr.join('')

            let tempRequestVal = ''
            tempRequestVal = tranRequestTempString === ''
              ? ''
              : JSON.stringify({ action: tranRequestTempString })

            // if (values.specialConfig === undefined || values.specialConfig === '') {
            //   tempRequestVal = tranRequestTempString === '' ? '' : JSON.stringify({ action: tranRequestTempString })
            // } else {
            //   tempRequestVal = tranRequestTempString === ''
            //     ? JSON.stringify({ specialConfig: values.specialConfig })
            //     : JSON.stringify({ specialConfig: values.specialConfig, action: tranRequestTempString })
            // }
            this.setState({
              formStep: formStep + 1,
              jobTranTableRequestValue: tempRequestVal,
              jobTranTableConfirmValue: tranRequestTempString === '' ? '' : `"${tranRequestTempString}"`
            })
            break
        }
      }
    })
  }

  backwardStep = () => {
    const { streamDiffType, formStep, tabPanelKey } = this.state
    if (tabPanelKey === 'flow') {
      if (streamDiffType === 'default') {
        this.setState({ formStep: formStep - 1 })
      } else if (streamDiffType === 'hdfslog') {
        this.setState({ formStep: formStep - 2 })
      }
    } else if (tabPanelKey === 'job') {
      this.setState({ formStep: formStep - 1 })
    }
  }

  generateStepButtons = () => {
    const { tabPanelKey } = this.state

    switch (this.state.formStep) {
      case 0:
        return (
          <div className="ri-workbench-step-button-area">
            <Button type="primary" className="next" onClick={this.forwardStep}>下一步</Button>
          </div>
        )
      case 1:
        return (
          <div className="ri-workbench-step-button-area">
            <Button type="ghost" onClick={this.backwardStep}>上一步</Button>
            <Button type="primary" className="next" onClick={this.forwardStep}>下一步</Button>
          </div>
        )
      case 2:
        return (
          <div className="ri-workbench-step-button-area">
            <Button type="ghost" onClick={this.backwardStep}>上一步</Button>
            <Button
              type="primary"
              className="next"
              loading={tabPanelKey === 'flow' ? this.props.flowSubmitLoading : this.props.jobSubmitLoading}
              onClick={tabPanelKey === 'flow' ? this.submitFlowForm : this.submitJobForm}>提交</Button>
          </div>
        )
      default:
        return ''
    }
  }

  initStartTS = (val) => {
    // 将 YYYY-MM-DD HH:mm:ss 转换成 YYYYMMDDHHmmss 格式
    const startTs = val.replace(/-| |:/g, '')
    this.setState({
      startTsVal: startTs
    })
  }

  initEndTS = (val) => {
    const endTs = val.replace(/-| |:/g, '')
    this.setState({ endTsVal: endTs })
  }

  submitJobForm = () => {
    const values = this.workbenchJobForm.getFieldsValue()

    const { projectId, jobMode, startTsVal, endTsVal, singleJobResult } = this.state
    const { jobResultFiledsOutput, jobTranTableRequestValue, jobSparkConfigValues } = this.state

    const maxRecordJson = { maxRecordPerPartitionProcessed: values.maxRecordPerPartitionProcessed }
    const maxRecord = JSON.stringify(maxRecordJson)
    const maxRecordAndResult = JSON.stringify(Object.assign({}, maxRecordJson, jobResultFiledsOutput))

    let sinkConfigRequest = ''
    if (values.resultFields === 'all') {
      sinkConfigRequest = (values.sinkConfig === undefined || values.sinkConfig === '')
        ? maxRecord
        : `{"maxRecordPerPartitionProcessed":${Number(values.maxRecordPerPartitionProcessed)},"sink_specific_config":${values.sinkConfig}}`
    } else {
      sinkConfigRequest = (values.sinkConfig === undefined || values.sinkConfig === '')
        ? maxRecordAndResult
        : `{"maxRecordPerPartitionProcessed":${values.maxRecordPerPartitionProcessed},"sink_specific_config":${values.sinkConfig},"sink_output":"${values.resultFieldsSelected}"}`
    }

    const tranConfigRequest = jobTranTableRequestValue === '' ? '' : `${jobTranTableRequestValue}`

    const requestCommon = {
      eventTsStart: (values.eventStartTs === undefined || values.eventStartTs === null || values.eventStartTs === '') ? '' : startTsVal,
      eventTsEnd: (values.eventEndTs === undefined || values.eventEndTs === null || values.eventEndTs === '') ? '' : endTsVal,
      sinkConfig: sinkConfigRequest,
      tranConfig: tranConfigRequest
    }

    if (jobMode === 'add') {
      const sourceDataInfo = [values.sourceDataSystem, values.sourceNamespace[0], values.sourceNamespace[1], values.sourceNamespace[2], '*', '*', '*'].join('.')
      const sinkDataInfo = [values.sinkDataSystem, values.sinkNamespace[0], values.sinkNamespace[1], values.sinkNamespace[2], '*', '*', '*'].join('.')

      const submitJobData = {
        projectId: Number(projectId),
        name: values.jobName,
        sourceNs: sourceDataInfo,
        sinkNs: sinkDataInfo,
        sourceType: values.type,
        sourceConfig: 'all'
      }

      new Promise((resolve) => {
        this.props.onAddJob(Object.assign({}, submitJobData, jobSparkConfigValues, requestCommon), () => {
          resolve()
          message.success('Job 添加成功！', 3)
        }, () => {
          this.hideJobSubmit()
          this.setState({
            jobTranTagClassName: '',
            jobTranTableClassName: 'hide',
            fieldSelected: 'hide',
            jobFormTranTableSource: []
          })
        })
      })
        .then(() => {
          this.workbenchJobForm.resetFields()
        })
    } else if (jobMode === 'edit') {
      new Promise((resolve) => {
        this.props.onEditJob(Object.assign({}, singleJobResult, jobSparkConfigValues, requestCommon), () => {
          resolve()
          message.success('Job 修改成功！', 3)
        }, () => {
          this.hideJobSubmit()
          this.setState({
            jobTranTagClassName: '',
            jobTranformTableClassName: 'hide',
            fieldSelected: 'hide',
            jobFormTranTableSource: []
          })
        })
      })
        .then(() => {
          this.workbenchJobForm.resetFields()
        })
    }
  }

  hideJobSubmit = () => this.setState({ jobMode: '' })

  submitFlowForm = () => {
    if (this.state.streamDiffType === 'default') {
      this.handleSubmitFlowDefault()
    } else if (this.state.streamDiffType === 'hdfslog') {
      this.handleSubmitFlowHdfslog()
    }
  }

  handleSubmitFlowDefault () {
    const values = this.workbenchFlowForm.getFieldsValue()
    const { projectId, flowMode, singleFlowResult } = this.state
    const { resultFiledsOutput, dataframeShowOrNot, etpStrategyRequestValue, transformTableRequestValue, pushdownConnectRequestValue } = this.state

    let sinkConfigRequest = ''
    if (values.resultFields === 'all') {
      sinkConfigRequest = (values.sinkConfig === undefined || values.sinkConfig === '')
        ? ''
        : `{"sink_specific_config":${values.sinkConfig}}`
    } else {
      sinkConfigRequest = (values.sinkConfig === undefined || values.sinkConfig === '')
        ? JSON.stringify(resultFiledsOutput)
        : `{"sink_specific_config":${values.sinkConfig},"sink_output":"${values.resultFieldsSelected}"}`
    }

    const etpStrategyRequestValFinal = etpStrategyRequestValue === '' ? etpStrategyRequestValue : `${etpStrategyRequestValue},`

    const tranConfigRequest = transformTableRequestValue === ''
      ? ''
      : `{${etpStrategyRequestValFinal}${transformTableRequestValue},${pushdownConnectRequestValue}${dataframeShowOrNot}}`

    if (flowMode === 'add' || flowMode === 'copy') {
      const sourceDataInfo = [values.sourceDataSystem, values.sourceNamespace[0], values.sourceNamespace[1], values.sourceNamespace[2], '*', '*', '*'].join('.')
      const sinkDataInfo = [values.sinkDataSystem, values.sinkNamespace[0], values.sinkNamespace[1], values.sinkNamespace[2], '*', '*', '*'].join('.')

      const submitFlowData = {
        projectId: Number(projectId),
        streamId: Number(values.flowStreamId),
        sourceNs: sourceDataInfo,
        sinkNs: sinkDataInfo,
        consumedProtocol: values.protocol,
        sinkConfig: `${sinkConfigRequest}`,
        tranConfig: tranConfigRequest
      }

      new Promise((resolve) => {
        this.props.onAddFlow(submitFlowData, () => {
          resolve()
          if (flowMode === 'add') {
            message.success('Flow 添加成功！', 3)
          } else if (flowMode === 'copy') {
            message.success('Flow 复制成功！', 3)
          }
        }, () => {
          this.hideFlowSubmit()
          this.setState({
            transformTagClassName: '',
            transformTableClassName: 'hide',
            transConnectClass: 'hide',
            fieldSelected: 'hide',
            etpStrategyCheck: false,
            dataframeShowSelected: 'hide',
            flowFormTranTableSource: []
          })
        })
      })
        .then(() => {
          // onchange 事件影响，Promise 解决
          this.workbenchFlowForm.resetFields()
          this.setState({
            flowKafkaInstanceValue: '',
            flowKafkaTopicValue: ''
          })
        })
    } else if (flowMode === 'edit') {
      const editData = {
        sinkConfig: `${sinkConfigRequest}`,
        tranConfig: tranConfigRequest,
        consumedProtocol: values.protocol
      }

      new Promise((resolve) => {
        this.props.onEditFlow(Object.assign({}, editData, singleFlowResult), () => {
          resolve()
          message.success('Flow 修改成功！', 3)
        }, () => {
          this.hideFlowSubmit()
          this.setState({
            transformTagClassName: '',
            transformTableClassName: 'hide',
            transConnectClass: 'hide',
            fieldSelected: 'hide',
            etpStrategyCheck: false,
            dataframeShowSelected: 'hide',
            flowFormTranTableSource: []
          })
        })
      })
        .then(() => {
          this.workbenchFlowForm.resetFields()
          this.setState({
            flowKafkaInstanceValue: '',
            flowKafkaTopicValue: ''
          })
        })
    }
  }

  handleSubmitFlowHdfslog () {
    const { flowMode, projectId, singleFlowResult } = this.state
    const { sourceToSinkExited } = this.props

    const values = this.workbenchFlowForm.getFieldsValue()
    if (flowMode === 'add' || flowMode === 'copy') {
      const sourceDataInfo = [values.sourceDataSystem, values.hdfslogNamespace[0], values.hdfslogNamespace[1], values.hdfslogNamespace[2], '*', '*', '*'].join('.')

      const submitFlowData = {
        projectId: Number(projectId),
        streamId: Number(values.flowStreamId),
        sourceNs: sourceDataInfo,
        sinkNs: sourceDataInfo,
        consumedProtocol: 'all',
        sinkConfig: '',
        tranConfig: ''
      }

      if (sourceToSinkExited === true) {
        message.error('Source to Sink 已存在！', 3)
      } else {
        new Promise((resolve) => {
          this.props.onAddFlow(submitFlowData, (result) => {
            resolve(result)
            if (result.length === 0) {
              message.success('该 Flow 已被创建！', 3)
            } else if (flowMode === 'add') {
              message.success('Flow 添加成功！', 3)
            } else if (flowMode === 'copy') {
              message.success('Flow 复制成功！', 3)
            }
          }, () => {
            this.hideFlowSubmit()
          })
        })
          .then(() => {
            this.workbenchFlowForm.resetFields()
          })
      }
    } else if (flowMode === 'edit') {
      const editData = {
        sinkConfig: '',
        tranConfig: '',
        consumedProtocol: 'all'
      }

      new Promise((resolve) => {
        this.props.onEditFlow(Object.assign({}, editData, singleFlowResult), () => {
          resolve()
          message.success('Flow 修改成功！', 3)
        }, () => {
          this.hideFlowSubmit()
        })
      })
        .then(() => {
          this.workbenchFlowForm.resetFields()
        })
    }
  }

  hideFlowSubmit = () => this.setState({ flowMode: '' })

  submitStreamForm = () => {
    const { projectId, streamMode, streamConfigValues, streamConfigCheck, streamQueryValues } = this.state
    const { streamNameExited } = this.props

    this.workbenchStreamForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        if (streamMode === 'add') {
          const requestValues = {
            name: values.streamName,
            desc: values.desc,
            instanceId: Number(values.kafka),
            streamType: values.type
          }

          if (streamNameExited === true) {
            this.workbenchStreamForm.setFields({
              streamName: {
                value: values.streamName,
                errors: [new Error('该 Name 已存在')]
              }
            })
            this.hideStreamSubmit()
          } else {
            this.props.onAddStream(projectId, Object.assign({}, requestValues, streamConfigValues), () => {
              message.success('Stream 添加成功！', 3)
              this.setState({
                streamMode: ''
              })
              this.workbenchStreamForm.resetFields()
              if (streamConfigCheck === true) {
                this.streamConfigForm.resetFields()
              }
              this.hideStreamSubmit()
            })
          }
        } else if (streamMode === 'edit') {
          const editValues = {
            desc: values.desc
          }
          const requestEditValues = Object.assign({}, editValues, streamQueryValues, streamConfigValues)

          this.props.onEditStream(requestEditValues, () => {
            message.success('Stream 修改成功！', 3)
            this.setState({ streamMode: '' })
            this.hideStreamSubmit()
          })
        }
      }
    })
  }

  hideStreamSubmit = () => {
    this.setState({
      isWormhole: true,
      streamConfigCheck: false
    })
  }

  // flow Transformation Modal
  onShowTransformModal = () => this.setState({ transformModalVisible: true })

  // Job Transformation Modal
  onShowJobTransModal = () => this.setState({ jobTransModalVisible: true })

  // flow transformation type 显示不同的内容
  onInitTransformValue = (value) => this.setState({ transformValue: value })

  // job transformation type 显示不同的内容
  onInitJobTransValue = (value) => this.setState({ jobTransValue: value })

  onEditTransform = (record) => (e) => {
    // 加隐藏字段获得 record.transformType
    this.setState({
      transformMode: 'edit',
      transformModalVisible: true,
      transformValue: record.transformType
    }, () => {
      this.flowTransformForm.setFieldsValue({
        editTransformId: record.order,
        transformation: record.transformType
      })

      if (record.transformType === 'lookupSql') {
        // 以"." 为分界线(注：sql语句中可能会出现 ".")
        const tranLookupVal1 = record.transformConfigInfo.substring(record.transformConfigInfo.indexOf('.') + 1) // 去除第一项后的字符串
        const tranLookupVal2 = tranLookupVal1.substring(tranLookupVal1.indexOf('.') + 1)  // 去除第二项后的字符串
        const tranLookupVal3 = tranLookupVal2.substring(tranLookupVal2.indexOf('.') + 1)  // 去除第三项后的字符串
        const tranLookupVal4 = tranLookupVal3.substring(tranLookupVal3.indexOf('.') + 1)  // 去除第四项后的字符串

        this.flowTransformForm.setFieldsValue({
          lookupSqlType: record.transformConfigInfo.substring(0, record.transformConfigInfo.indexOf('.')),
          transformSinkDataSystem: tranLookupVal1.substring(0, tranLookupVal1.indexOf('.')),
          lookupSql: tranLookupVal4
        })
        setTimeout(() => {
          this.flowTransformForm.setFieldsValue({
            transformSinkNamespace: [
              tranLookupVal2.substring(0, tranLookupVal2.indexOf('.')),
              tranLookupVal3.substring(0, tranLookupVal3.indexOf('.'))
            ]
          })
        }, 50)
      } else if (record.transformType === 'sparkSql') {
        this.flowTransformForm.setFieldsValue({
          sparkSql: record.transformConfigInfo
        })
      } else if (record.transformType === 'streamJoinSql') {
        // 以"."为分界线
        const tranStreamJoinVal1 = record.transformConfigInfo.substring(record.transformConfigInfo.indexOf('.') + 1) // 去除第一项后的字符串
        const tranStreamJoinVal2 = tranStreamJoinVal1.substring(tranStreamJoinVal1.indexOf('.') + 1)  // 去除第二项后的字符串

        this.flowTransformForm.setFieldsValue({
          streamJoinSqlType: record.transformConfigInfo.substring(0, record.transformConfigInfo.indexOf('.')),
          timeout: tranStreamJoinVal1.substring(0, tranStreamJoinVal1.indexOf('.')),
          streamJoinSql: tranStreamJoinVal2
        })
      } else if (record.transformType === 'transformClassName') {
        this.flowTransformForm.setFieldsValue({
          transformClassName: record.transformConfigInfo
        })
      }
    })
  }

  onJobEditTransform = (record) => (e) => {
    // 加隐藏字段获得 record.transformType
    this.setState({
      transformMode: 'edit',
      jobTransModalVisible: true,
      jobTransValue: record.transformType
    }, () => {
      this.flowTransformForm.setFieldsValue({
        editTransformId: record.order,
        transformation: record.transformType
      })

      if (record.transformType === 'sparkSql') {
        this.flowTransformForm.setFieldsValue({
          sparkSql: record.transformConfigInfo
        })
      } else if (record.transformType === 'transformClassName') {
        this.flowTransformForm.setFieldsValue({
          transformClassName: record.transformConfigInfo
        })
      }
    })
  }

  onAddTransform = (record) => (e) => {
    this.setState({
      transformMode: 'add',
      transformModalVisible: true,
      transformValue: ''
    }, () => {
      this.flowTransformForm.resetFields()
      this.flowTransformForm.setFieldsValue({
        editTransformId: record.order
      })
    })
  }

  onJobAddTransform = (record) => (e) => {
    this.setState({
      transformMode: 'add',
      jobTransModalVisible: true,
      jobTransValue: ''
    }, () => {
      this.flowTransformForm.resetFields()
      this.flowTransformForm.setFieldsValue({
        editTransformId: record.order
      })
    })
  }

  hideTransformModal = () => {
    this.setState({
      transformModalVisible: false,
      transformValue: ''
    })
    this.flowTransformForm.resetFields()
  }

  hideJobTransModal = () => {
    this.setState({
      jobTransModalVisible: false,
      jobTransValue: ''
    })
    this.flowTransformForm.resetFields()
  }

  onJobTransModalOk = () => {
    const { transformMode } = this.state

    this.flowTransformForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let transformConfigInfoString = ''
        let transformConfigInfoRequestString = ''

        let num = 0
        let valLength = 0
        let finalVal = ''

        if (values.transformation === 'sparkSql') {
          const sparkSqlVal = values.sparkSql.replace(/(^\s*)|(\s*$)/g, '')

          transformConfigInfoString = sparkSqlVal
          transformConfigInfoRequestString = `spark_sql = ${sparkSqlVal}`

          num = (sparkSqlVal.split(';')).length - 1
          valLength = sparkSqlVal.length
          finalVal = sparkSqlVal.substring(sparkSqlVal.length - 1)
        } else if (values.transformation === 'transformClassName') {
          const transformClassNameVal = values.transformClassName.replace(/(^\s*)|(\s*$)/g, '')

          transformConfigInfoString = transformClassNameVal
          transformConfigInfoRequestString = `custom_class = ${transformClassNameVal}`

          num = (transformClassNameVal.split(';')).length - 1
          valLength = transformClassNameVal.length
          finalVal = transformClassNameVal.substring(transformClassNameVal.length - 1)
        }

        if (num === 0) {
          message.warning('SQL语句应以一个分号结束！', 3)
        } else if (num > 1) {
          message.warning('SQL语句应只有一个分号！', 3)
        } else if (num === 1 && finalVal !== ';') {
          message.warning('SQL语句应以一个分号结束！', 3)
        } else if (num === 1 && finalVal === ';') {
          if (valLength === 1) {
            message.warning('请填写 SQL语句内容！', 3)
          } else {
            // 加隐藏字段 transformType, 获得每次选中的transformation type
            if (transformMode === '') {
              // 第一次添加数据时
              this.state.jobFormTranTableSource.push({
                transformType: values.transformation,
                order: 1,
                transformConfigInfo: transformConfigInfoString,
                transformConfigInfoRequest: transformConfigInfoRequestString
              })
            } else if (transformMode === 'edit') {
              this.state.jobFormTranTableSource[values.editTransformId - 1] = {
                transformType: values.transformation,
                order: values.editTransformId,
                transformConfigInfo: transformConfigInfoString,
                transformConfigInfoRequest: transformConfigInfoRequestString
              }
            } else if (transformMode === 'add') {
              const tableSourceArr = this.state.jobFormTranTableSource
              // 当前插入的数据
              tableSourceArr.splice(values.editTransformId, 0, {
                transformType: values.transformation,
                order: values.editTransformId + 1,
                transformConfigInfo: transformConfigInfoString,
                transformConfigInfoRequest: transformConfigInfoRequestString
              })
              // 当前数据的下一条开始，order+1
              for (let i = values.editTransformId + 1; i < tableSourceArr.length; i++) {
                tableSourceArr[i].order = tableSourceArr[i].order + 1
              }
              // 重新setState数组
              this.setState({ jobFormTranTableSource: tableSourceArr })
            }
            this.jobTranModalOkSuccess()
          }
        }
      }
    })
  }

  jobTranModalOkSuccess () {
    this.setState({
      jobTranTagClassName: 'hide',
      jobTranTableClassName: '',
      jobTranConnectClass: ''
    })
    this.hideJobTransModal()
  }

  onTransformModalOk = () => {
    const { transformMode, transformSinkNamespaceArray, step2SourceNamespace } = this.state
    this.flowTransformForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let transformConfigInfoString = ''
        let tranConfigInfoSqlString = ''
        let transformConfigInfoRequestString = ''
        let pushdownConnectionString = ''

        let num = 0
        let valLength = 0
        let finalVal = ''

        if (values.transformation === 'lookupSql') {
          // values.transformSinkNamespace 为 []
          // 去掉字符串前后的空格
          const lookupSqlValTemp = values.lookupSql.replace(/(^\s*)|(\s*$)/g, '')
          const lookupSqlVal = preProcessSql(lookupSqlValTemp)

          let lookupSqlTypeOrigin = ''
          if (values.lookupSqlType === 'leftJoin') {
            lookupSqlTypeOrigin = 'left join'
          } else if (values.lookupSqlType === 'union') {
            lookupSqlTypeOrigin = 'union'
          }

          const sysInsDb = [values.transformSinkDataSystem, values.transformSinkNamespace[0], values.transformSinkNamespace[1]].join('.')
          transformConfigInfoString = `${values.lookupSqlType}.${values.transformSinkDataSystem}.${values.transformSinkNamespace.join('.')}.${lookupSqlVal}`
          tranConfigInfoSqlString = lookupSqlVal
          transformConfigInfoRequestString = `pushdown_sql ${lookupSqlTypeOrigin} with ${sysInsDb} = ${lookupSqlVal}`
          const tmp = transformSinkNamespaceArray.find(i => [i.nsSys, i.nsInstance, i.nsDatabase].join('.') === sysInsDb)

          const pushdownConnectJson = tmp.connection_config === null
            ? {
              name_space: `${tmp.nsSys}.${tmp.nsInstance}.${tmp.nsDatabase}`,
              jdbc_url: tmp.conn_url,
              username: tmp.user,
              password: tmp.pwd
            }
            : {
              name_space: `${tmp.nsSys}.${tmp.nsInstance}.${tmp.nsDatabase}`,
              jdbc_url: tmp.conn_url,
              username: tmp.user,
              password: tmp.pwd,
              connection_config: tmp.connection_config
            }

          pushdownConnectionString = JSON.stringify(pushdownConnectJson)

          num = (lookupSqlVal.split(';')).length - 1
          valLength = lookupSqlVal.length
          finalVal = lookupSqlVal.substring(lookupSqlVal.length - 1)
        } else if (values.transformation === 'sparkSql') {
          const sparkSqlValTemp = values.sparkSql.replace(/(^\s*)|(\s*$)/g, '')
          const sparkSqlVal = preProcessSql(sparkSqlValTemp)

          transformConfigInfoString = sparkSqlVal
          tranConfigInfoSqlString = sparkSqlVal
          transformConfigInfoRequestString = `spark_sql = ${sparkSqlVal}`
          pushdownConnectionString = ''

          num = (sparkSqlVal.split(';')).length - 1
          valLength = sparkSqlVal.length
          finalVal = sparkSqlVal.substring(sparkSqlVal.length - 1)
        } else if (values.transformation === 'streamJoinSql') {
          const streamJoinSqlValTemp = values.streamJoinSql.replace(/(^\s*)|(\s*$)/g, '')
          const streamJoinSqlVal = preProcessSql(streamJoinSqlValTemp)

          let streamJoinSqlTypeOrigin = ''
          if (values.streamJoinSqlType === 'leftJoin') {
            streamJoinSqlTypeOrigin = 'left join'
          } else if (values.streamJoinSqlType === 'innerJoin') {
            streamJoinSqlTypeOrigin = 'inner join'
          }
          // transformConfigInfoString = `${values.streamJoinSqlType}.${values.streamJoinSqlConfig}.${values.timeout}.${streamJoinSqlVal}`
          transformConfigInfoString = `${values.streamJoinSqlType}.${values.timeout}.${streamJoinSqlVal}`
          tranConfigInfoSqlString = streamJoinSqlVal
          transformConfigInfoRequestString = `parquet_sql ${streamJoinSqlTypeOrigin} with ${step2SourceNamespace}.*.*.*(${values.timeout}) = ${streamJoinSqlVal}`
          pushdownConnectionString = ''

          num = (streamJoinSqlVal.split(';')).length - 1
          valLength = streamJoinSqlVal.length
          finalVal = streamJoinSqlVal.substring(streamJoinSqlVal.length - 1)
        } else if (values.transformation === 'transformClassName') {
          const transformClassNameValTemp = values.transformClassName.replace(/(^\s*)|(\s*$)/g, '')
          const transformClassNameVal = preProcessSql(transformClassNameValTemp)

          transformConfigInfoString = transformClassNameVal
          tranConfigInfoSqlString = transformClassNameVal
          transformConfigInfoRequestString = `custom_class = ${transformClassNameVal}`
          pushdownConnectionString = ''

          num = (transformClassNameVal.split(';')).length - 1
          valLength = transformClassNameVal.length
          finalVal = transformClassNameVal.substring(transformClassNameVal.length - 1)
        }

        if (num === 0) {
          message.warning('SQL语句应以一个分号结束！', 3)
        } else if (num > 1) {
          message.warning('SQL语句应只有一个分号！', 3)
        } else if (num === 1 && finalVal !== ';') {
          message.warning('SQL语句应以一个分号结束！', 3)
        } else if (num === 1 && finalVal === ';') {
          if (valLength === 1) {
            message.warning('请填写 SQL语句内容！', 3)
          } else {
            // 加隐藏字段 transformType, 获得每次选中的transformation type
            if (transformMode === '') {
              // 第一次添加数据时
              this.state.flowFormTranTableSource.push({
                transformType: values.transformation,
                order: 1,
                transformConfigInfo: transformConfigInfoString,
                tranConfigInfoSql: tranConfigInfoSqlString,
                transformConfigInfoRequest: transformConfigInfoRequestString,
                pushdownConnection: pushdownConnectionString
              })

              this.setState({
                dataframeShowSelected: 'hide'
              }, () => {
                this.workbenchFlowForm.setFieldsValue({
                  dataframeShow: 'false',
                  dataframeShowNum: 10
                })
              })
            } else if (transformMode === 'edit') {
              this.state.flowFormTranTableSource[values.editTransformId - 1] = {
                transformType: values.transformation,
                order: values.editTransformId,
                transformConfigInfo: transformConfigInfoString,
                tranConfigInfoSql: tranConfigInfoSqlString,
                transformConfigInfoRequest: transformConfigInfoRequestString,
                pushdownConnection: pushdownConnectionString
              }
            } else if (transformMode === 'add') {
              const tableSourceArr = this.state.flowFormTranTableSource
              // 当前插入的数据
              tableSourceArr.splice(values.editTransformId, 0, {
                transformType: values.transformation,
                order: values.editTransformId + 1,
                transformConfigInfo: transformConfigInfoString,
                tranConfigInfoSql: tranConfigInfoSqlString,
                transformConfigInfoRequest: transformConfigInfoRequestString,
                pushdownConnection: pushdownConnectionString
              })
              // 当前数据的下一条开始，order+1
              for (let i = values.editTransformId + 1; i < tableSourceArr.length; i++) {
                tableSourceArr[i].order = tableSourceArr[i].order + 1
              }
              // 重新setState数组
              this.setState({ flowFormTranTableSource: tableSourceArr })
            }
            this.tranModalOkSuccess()
          }
        }
      }
    })
  }

  tranModalOkSuccess () {
    this.setState({
      transformTagClassName: 'hide',
      transformTableClassName: '',
      transConnectClass: ''
    })
    this.hideTransformModal()
  }

  onDeleteSingleTransform = (record) => (e) => {
    const tableSourceArr = this.state.flowFormTranTableSource
    if (tableSourceArr.length === 1) {
      this.setState({
        transformTagClassName: '',
        transformTableClassName: 'hide',
        transConnectClass: 'hide',
        fieldSelected: 'hide',
        etpStrategyCheck: false,
        etpStrategyConfirmValue: '',
        dataframeShowSelected: 'hide',
        transformMode: '',
        transformValue: '',
        dataframeShowNumValue: ''
      }, () => {
        this.workbenchFlowForm.setFieldsValue({
          dataframeShow: 'false',
          dataframeShowNum: 10
        })
      })
    }

    // 删除当条数据
    tableSourceArr.splice(record.order - 1, 1)

    // 当条下的数据 order-1
    for (let i = record.order - 1; i < tableSourceArr.length; i++) {
      tableSourceArr[i].order = tableSourceArr[i].order - 1
    }
    this.setState({ flowFormTranTableSource: tableSourceArr })
  }

  onJobDeleteSingleTransform = (record) => (e) => {
    const tableSourceArr = this.state.jobFormTranTableSource
    if (tableSourceArr.length === 1) {
      this.setState({
        jobTranTagClassName: '',
        jobTranTableClassName: 'hide',
        jobTranConnectClass: 'hide',
        fieldSelected: 'hide',
        transformMode: '',
        jobTransValue: ''
      })
    }

    // 删除当条数据
    tableSourceArr.splice(record.order - 1, 1)

    // 当条下的数据 order-1
    for (let i = record.order - 1; i < tableSourceArr.length; i++) {
      tableSourceArr[i].order = tableSourceArr[i].order - 1
    }
    this.setState({ jobFormTranTableSource: tableSourceArr })
  }

  onUpTransform = (record) => (e) => {
    const tableSourceArr = this.state.flowFormTranTableSource

    // 当前数据
    let currentInfo = [{
      transformType: record.transformType,
      order: record.order,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest,
      pushdownConnection: record.pushdownConnection
    }]

    // 上一条数据
    let beforeArr = tableSourceArr.slice(record.order - 2, record.order - 1)

    currentInfo[0] = {
      transformType: beforeArr[0].transformType,
      order: record.order,
      transformConfigInfo: beforeArr[0].transformConfigInfo,
      tranConfigInfoSql: beforeArr[0].tranConfigInfoSql,
      transformConfigInfoRequest: beforeArr[0].transformConfigInfoRequest,
      pushdownConnection: beforeArr[0].pushdownConnection
    }

    beforeArr[0] = {
      transformType: record.transformType,
      order: record.order - 1,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest,
      pushdownConnection: record.pushdownConnection
    }

    tableSourceArr.splice(record.order - 2, 2, beforeArr[0], currentInfo[0])

    this.setState({ flowFormTranTableSource: tableSourceArr })
  }

  onJobUpTransform = (record) => (e) => {
    const tableSourceArr = this.state.jobFormTranTableSource

    // 当前数据
    let currentInfo = [{
      transformType: record.transformType,
      order: record.order,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest
    }]

    // 上一条数据
    let beforeArr = tableSourceArr.slice(record.order - 2, record.order - 1)

    currentInfo[0] = {
      transformType: beforeArr[0].transformType,
      order: record.order,
      transformConfigInfo: beforeArr[0].transformConfigInfo,
      tranConfigInfoSql: beforeArr[0].tranConfigInfoSql,
      transformConfigInfoRequest: beforeArr[0].transformConfigInfoRequest
    }

    beforeArr[0] = {
      transformType: record.transformType,
      order: record.order - 1,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest
    }

    tableSourceArr.splice(record.order - 2, 2, beforeArr[0], currentInfo[0])

    this.setState({ jobFormTranTableSource: tableSourceArr })
  }

  onDownTransform = (record) => (e) => {
    const tableSourceArr = this.state.flowFormTranTableSource

    // 当前数据
    let currentInfo = [{
      transformType: record.transformType,
      order: record.order,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest,
      pushdownConnection: record.pushdownConnection
    }]

    // 下一条数据
    let afterArr = tableSourceArr.slice(record.order, record.order + 1)

    currentInfo[0] = {
      transformType: afterArr[0].transformType,
      order: record.order,
      transformConfigInfo: afterArr[0].transformConfigInfo,
      tranConfigInfoSql: afterArr[0].tranConfigInfoSql,
      transformConfigInfoRequest: afterArr[0].transformConfigInfoRequest,
      pushdownConnection: afterArr[0].pushdownConnection
    }

    afterArr[0] = {
      transformType: record.transformType,
      order: record.order + 1,
      transformConfigInfo: record.transformConfigInfo,
      tranConfigInfoSql: record.tranConfigInfoSql,
      transformConfigInfoRequest: record.transformConfigInfoRequest,
      pushdownConnection: record.pushdownConnection
    }

    tableSourceArr.splice(record.order - 1, 2, currentInfo[0], afterArr[0])

    this.setState({ flowFormTranTableSource: tableSourceArr })
  }

  onJobDownTransform = (record) => (e) => {
    const tableSourceArr = this.state.jobFormTranTableSource

    // 当前数据
    let currentInfo = [{
      transformType: record.transformType,
      order: record.order,
      transformConfigInfo: record.transformConfigInfo,
      transformConfigInfoRequest: record.transformConfigInfoRequest
    }]

    // 下一条数据
    let afterArr = tableSourceArr.slice(record.order, record.order + 1)

    currentInfo[0] = {
      transformType: afterArr[0].transformType,
      order: record.order,
      transformConfigInfo: afterArr[0].transformConfigInfo,
      transformConfigInfoRequest: afterArr[0].transformConfigInfoRequest
    }

    afterArr[0] = {
      transformType: record.transformType,
      order: record.order + 1,
      transformConfigInfo: record.transformConfigInfo,
      transformConfigInfoRequest: record.transformConfigInfoRequest
    }

    tableSourceArr.splice(record.order - 1, 2, currentInfo[0], afterArr[0])

    this.setState({ jobFormTranTableSource: tableSourceArr })
  }

  /**
   * Flow ETP Strategy Modal
   * */
  onShowEtpStrategyModal = () => {
    const { etpStrategyCheck, etpStrategyResponseValue } = this.state

    this.setState({
      etpStrategyModalVisible: true
    }, () => {
      if (etpStrategyCheck === true) {
        this.flowEtpStrategyForm.setFieldsValue({
          checkColumns: etpStrategyResponseValue.check_columns,
          checkRule: etpStrategyResponseValue.check_rule,
          ruleMode: etpStrategyResponseValue.rule_mode,
          ruleParams: etpStrategyResponseValue.rule_params,
          againstAction: etpStrategyResponseValue.against_action
        })
      } else {
        this.flowEtpStrategyForm.resetFields()
      }
    })
  }

  hideEtpStrategyModal = () => this.setState({ etpStrategyModalVisible: false })

  onEtpStrategyModalOk = () => {
    this.flowEtpStrategyForm.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const valueJson = {
          check_columns: values.checkColumns,
          check_rule: values.checkRule,
          rule_mode: values.ruleMode,
          rule_params: values.ruleParams,
          against_action: values.againstAction
        }

        this.setState({
          etpStrategyCheck: true,
          etpStrategyRequestValue: `"validity":${JSON.stringify(valueJson)}`,
          etpStrategyConfirmValue: JSON.stringify(valueJson)
        })
        this.hideEtpStrategyModal()
      }
    })
  }

  /**
   * Flow Sink Config Modal
   * */
  onShowSinkConfigModal = () => {
    this.setState({
      sinkConfigModalVisible: true
    }, () => {
      if (!this.cm) {
        this.cm = CodeMirror.fromTextArea(this.sinkConfigInput, {
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          mode: 'application/ld+json',
          lineWrapping: true
        })
        this.cm.setSize('100%', '256px')
      }
      this.cm.doc.setValue(this.workbenchFlowForm.getFieldValue('sinkConfig') || '')
    })
  }

  hideSinkConfigModal = () => {
    this.setState({ sinkConfigModalVisible: false })
  }

  onSinkConfigModalOk = () => {
    this.workbenchFlowForm.setFieldsValue({
      sinkConfig: this.cm.doc.getValue()
    })
    this.hideSinkConfigModal()
  }

  /**
   * Job Sink Config Modal
   * */
  onShowJobSinkConfigModal = () => {
    this.setState({
      jobSinkConfigModalVisible: true
    }, () => {
      if (!this.cmJob) {
        this.cmJob = CodeMirror.fromTextArea(this.jobSinkConfigInput, {
          lineNumbers: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          mode: 'application/ld+json',
          lineWrapping: true
        })
        this.cmJob.setSize('100%', '256px')
      }
      this.cmJob.doc.setValue(this.workbenchJobForm.getFieldValue('sinkConfig') || '')
    })
  }

  hideJobSinkConfigModal = () => {
    this.setState({ jobSinkConfigModalVisible: false })
  }

  onJobSinkConfigModalOk = () => {
    this.workbenchJobForm.setFieldsValue({
      sinkConfig: this.cmJob.doc.getValue()
    })
    this.hideJobSinkConfigModal()
  }

  showAddJobWorkbench = () => {
    this.workbenchJobForm.resetFields()

    this.setState({
      jobMode: 'add',
      formStep: 0,
      sparkConfigCheck: false,
      jobFormTranTableSource: [],
      jobTranTagClassName: '',
      jobTranTableClassName: 'hide',
      fieldSelected: 'hide',
      resultFieldsValue: 'all'
    }, () => {
      this.workbenchJobForm.setFieldsValue({
        type: 'hdfs_txt',
        resultFields: 'all'
      })
    })

    this.props.onLoadStreamConfigJvm((result) => {
      const othersInit = 'spark.locality.wait=10ms,spark.shuffle.spill.compress=false,spark.io.compression.codec=org.apache.spark.io.SnappyCompressionCodec,spark.streaming.stopGracefullyOnShutdown=true,spark.scheduler.listenerbus.eventqueue.size=1000000,spark.sql.ui.retainedExecutions=3,spark.sql.shuffle.partitions=18'

      const startConfigJson = {
        driverCores: 1,
        driverMemory: 2,
        executorNums: 6,
        perExecutorMemory: 2,
        perExecutorCores: 1
      }

      this.setState({
        jobSparkConfigValues: {
          sparkConfig: `${result},${othersInit}`,
          startConfig: `${JSON.stringify(startConfigJson)}`
        }
      })
    })
  }

  /***
   *  验证 Job name 是否存在
   * */
  onInitJobNameValue = (value) => {
    this.props.onLoadJobName(this.state.projectId, value, () => {}, () => {
      this.workbenchJobForm.setFields({
        jobName: {
          value: value,
          errors: [new Error('该 Name 已存在')]
        }
      })
    })
  }

  /**
   * Dag 图
   * */
  // showStreamDagModal = () => {
  //   this.setState({
  //     streamDagModalShow: ''
  //   })
  // }
  //
  // hideStreamDagModal = () => {
  //   this.setState({
  //     streamDagModalShow: 'hide'
  //   })
  // }
  //
  // showFlowDagModal = () => {
  //   this.setState({
  //     flowDagModalShow: ''
  //   })
  // }
  //
  // hideFlowDagModal = () => {
  //   this.setState({
  //     flowDagModalShow: 'hide'
  //   })
  // }

  render () {
    const { flowMode, streamMode, jobMode, formStep, isWormhole } = this.state
    const { flowFormTranTableSource, jobFormTranTableSource } = this.state
    const { streams, projectNamespaces, streamSubmitLoading } = this.props

    const sidebarPrefixes = {
      add: '新增',
      edit: '修改',
      copy: '复制'
    }

    const stepButtons = this.generateStepButtons()

    const paneHeight = document.documentElement.clientHeight - 64 - 50 - 48

    return (
      <div className="workbench-main-body">
        <Helmet title="Workbench" />
        <Tabs
          defaultActiveKey="flow"
          className="ri-tabs"
          animated={false}
          onChange={this.changeTag}
        >
          {/* Flow Panel */}
          <TabPane tab="Flow" key="flow" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <Flow
                className={flowMode ? 'op-mode' : ''}
                onShowAddFlow={this.showAddFlowWorkbench}
                onShowEditFlow={this.showEditFlowWorkbench}
                onShowCopyFlow={this.showCopyFlowWorkbench}
                projectIdGeted={this.state.projectId}
                flowClassHide={this.state.flowClassHide}
              />
              <div className={`ri-workbench-sidebar ri-common-block ${flowMode ? 'op-mode' : ''}`}>
                <h3 className="ri-common-block-title">
                  {`${sidebarPrefixes[flowMode] || ''} Flow`}
                </h3>
                <div className="ri-common-block-tools">
                  <Button icon="arrow-left" type="ghost" onClick={this.hideFlowWorkbench}></Button>
                </div>
                <div className="ri-workbench-sidebar-container">
                  <Steps current={formStep}>
                    <Step title="Pipeline" />
                    <Step title="Transformation" />
                    <Step title="Confirmation" />
                  </Steps>
                  <WorkbenchFlowForm
                    step={formStep}
                    sourceNamespaces={projectNamespaces || []}
                    sinkNamespaces={projectNamespaces || []}
                    streams={streams || []}
                    flowMode={this.state.flowMode}
                    projectIdGeted={this.state.projectId}

                    onShowTransformModal={this.onShowTransformModal}
                    onShowEtpStrategyModal={this.onShowEtpStrategyModal}
                    onShowSinkConfigModal={this.onShowSinkConfigModal}

                    transformTableSource={flowFormTranTableSource}
                    // onStreamJoinSqlConfigTypeSelect={this.onStreamJoinSqlConfigTypeSelect}
                    transformTagClassName={this.state.transformTagClassName}
                    transformTableClassName={this.state.transformTableClassName}
                    transConnectClass={this.state.transConnectClass}
                    onEditTransform={this.onEditTransform}
                    onAddTransform={this.onAddTransform}
                    onDeleteSingleTransform={this.onDeleteSingleTransform}
                    onUpTransform={this.onUpTransform}
                    onDownTransform={this.onDownTransform}

                    step2SinkNamespace={this.state.step2SinkNamespace}
                    step2SourceNamespace={this.state.step2SourceNamespace}

                    etpStrategyCheck={this.state.etpStrategyCheck}
                    initResultFieldClass={this.initResultFieldClass}
                    initDataShowClass={this.initDataShowClass}
                    fieldSelected={this.state.fieldSelected}
                    dataframeShowSelected={this.state.dataframeShowSelected}

                    onInitStreamTypeSelect={this.onInitStreamTypeSelect}
                    onInitStreamNameSelect={this.onInitStreamNameSelect}
                    selectStreamKafkaTopicValue={this.state.selectStreamKafkaTopicValue}
                    onInitSourceTypeNamespace={this.onInitSourceTypeNamespace}
                    onInitHdfslogNamespace={this.onInitHdfslogNamespace}
                    onInitSinkTypeNamespace={this.onInitSinkTypeNamespace}
                    sourceTypeNamespaceData={this.state.sourceTypeNamespaceData}
                    hdfslogNsData={this.state.hdfslogNsData}
                    sinkTypeNamespaceData={this.state.sinkTypeNamespaceData}

                    resultFieldsValue={this.state.resultFieldsValue}
                    dataframeShowNumValue={this.state.dataframeShowNumValue}
                    etpStrategyConfirmValue={this.state.etpStrategyConfirmValue}
                    transformTableConfirmValue={this.state.transformTableConfirmValue}

                    transformTableRequestValue={this.state.transformTableRequestValue}
                    streamDiffType={this.state.streamDiffType}
                    hdfslogSinkDataSysValue={this.state.hdfslogSinkDataSysValue}
                    hdfslogSinkNsValue={this.state.hdfslogSinkNsValue}
                    initialHdfslogCascader={this.initialHdfslogCascader}

                    flowKafkaInstanceValue={this.state.flowKafkaInstanceValue}
                    flowKafkaTopicValue={this.state.flowKafkaTopicValue}

                    ref={(f) => { this.workbenchFlowForm = f }}
                  />
                  {/* Flow Transform Modal */}
                  <Modal
                    title="Transformation"
                    okText="保存"
                    wrapClassName="transform-form-style"
                    visible={this.state.transformModalVisible}
                    onOk={this.onTransformModalOk}
                    onCancel={this.hideTransformModal}>
                    <FlowTransformForm
                      ref={(f) => { this.flowTransformForm = f }}
                      projectIdGeted={this.state.projectId}
                      tabPanelKey={this.state.tabPanelKey}
                      sinkNamespaces={projectNamespaces || []}
                      onInitTransformValue={this.onInitTransformValue}
                      transformValue={this.state.transformValue}
                      step2SinkNamespace={this.state.step2SinkNamespace}
                      step2SourceNamespace={this.state.step2SourceNamespace}
                      onInitTransformSinkTypeNamespace={this.onInitTransformSinkTypeNamespace}
                      transformSinkTypeNamespaceData={this.state.transformSinkTypeNamespaceData}
                    />
                  </Modal>
                  {/* Flow Sink Config Modal */}
                  <Modal
                    title="Sink Config"
                    okText="保存"
                    wrapClassName="ant-modal-large"
                    visible={this.state.sinkConfigModalVisible}
                    onOk={this.onSinkConfigModalOk}
                    onCancel={this.hideSinkConfigModal}>
                    <div>
                      <h4 className="sink-config-modal-class">{this.state.sinkConfigMsg}</h4>
                      <textarea
                        ref={(f) => { this.sinkConfigInput = f }}
                        placeholder="Paste your Sink Config JSON here."
                        className="ant-input ant-input-extra"
                        rows="5">
                      </textarea>
                    </div>

                  </Modal>
                  {/* ETP Strategy Modal */}
                  <Modal
                    title="Event Time Processing Strategy"
                    okText="保存"
                    visible={this.state.etpStrategyModalVisible}
                    onOk={this.onEtpStrategyModalOk}
                    onCancel={this.hideEtpStrategyModal}>
                    <FlowEtpStrategyForm
                      ref={(f) => { this.flowEtpStrategyForm = f }}
                    />
                  </Modal>
                  {stepButtons}
                </div>
              </div>
              {/* <div className={`ri-workbench-graph ri-common-block ${flowMode ? 'op-mode' : ''}`}>
                <h3 className="ri-common-block-title">Flow DAG</h3>
                <div className="ri-common-block-tools">
                   <Button icon="arrows-alt" type="ghost" onClick={this.showFlowDagModal}></Button>
                </div>
              </div> */}
              {/* <div className={this.state.flowDagModalShow}>
                <div className="dag-madal-mask"></div>
                <div className="dag-modal">
                  <Button icon="shrink" type="ghost" className="hide-dag-modal" onClick={this.hideFlowDagModal}></Button>
                  <FlowDagModal />
                </div>
              </div> */}
            </div>
          </TabPane>
          {/* Stream Panel */}
          <TabPane tab="Stream" key="stream" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <Manager
                className={streamMode ? 'streamAndSink-op-mode' : ''}
                projectIdGeted={this.state.projectId}
                onShowAddStream={this.showAddStreamWorkbench}
                onShowEditStream={this.showEditStreamWorkbench}
                streamClassHide={this.state.streamClassHide}
              />
              <div className={`ri-workbench-sidebar ri-common-block ${streamMode ? 'streamAndSink-op-mode' : ''}`}>
                <h3 className="ri-common-block-title">
                  {`${sidebarPrefixes[streamMode] || ''} Stream`}
                </h3>
                <div className="ri-common-block-tools">
                  <Button icon="arrow-left" type="ghost" onClick={this.hideStreamWorkbench}></Button>
                </div>
                <div className="ri-workbench-sidebar-container">
                  <WorkbenchStreamForm
                    isWormhole={isWormhole}
                    streamMode={this.state.streamMode}
                    onInitStreamNameValue={this.onInitStreamNameValue}
                    kafkaValues={this.state.kafkaValues}

                    onShowConfigModal={this.onShowConfigModal}
                    streamConfigCheck={this.state.streamConfigCheck}
                    topicEditValues={this.state.topicEditValues}

                    ref={(f) => { this.workbenchStreamForm = f }}
                  />
                  {/* Config Modal */}
                  <Modal
                    title="Configs"
                    okText="保存"
                    wrapClassName="ant-modal-large"
                    visible={this.state.streamConfigModalVisible}
                    onOk={this.onConfigModalOk}
                    onCancel={this.hideConfigModal}>
                    <StreamConfigForm
                      tabPanelKey={this.state.tabPanelKey}
                      ref={(f) => { this.streamConfigForm = f }}
                    />
                  </Modal>
                  <div className="ri-workbench-step-button-area">
                    <Button
                      type="primary"
                      className="next"
                      onClick={this.submitStreamForm}
                      loading={streamSubmitLoading}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              </div>
              {/* <div className={`ri-workbench-graph ri-common-block ${streamMode ? 'op-mode' : ''}`}>
                <h3 className="ri-common-block-title">Stream DAG</h3>
                <div className="ri-common-block-tools">
                   <Button icon="arrows-alt" type="ghost" onClick={this.showStreamDagModal}></Button>
                </div>
              </div> */}
              {/* <div className={this.state.streamDagModalShow}>
                <div className="dag-madal-mask"></div>
                <div className="dag-modal">
                  <Button icon="shrink" type="ghost" className="hide-dag-modal" onClick={this.hideStreamDagModal}></Button>
                  <StreamDagModal />
                </div>
              </div> */}
            </div>
          </TabPane>
          {/* Job Panel */}
          <TabPane tab="Job" key="job" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <Job
                className={jobMode ? 'op-mode' : ''}
                onShowAddJob={this.showAddJobWorkbench}
                onShowEditJob={this.showEditJobWorkbench}
                projectIdGeted={this.state.projectId}
                jobClassHide={this.state.jobClassHide}
              />
              <div className={`ri-workbench-sidebar ri-common-block ${jobMode ? 'op-mode' : ''}`}>
                <h3 className="ri-common-block-title">
                  {`${sidebarPrefixes[jobMode] || ''} Job`}
                </h3>
                <div className="ri-common-block-tools">
                  <Button icon="arrow-left" type="ghost" onClick={this.hideJobWorkbench}></Button>
                </div>
                <div className="ri-workbench-sidebar-container">
                  <Steps current={formStep}>
                    <Step title="Pipeline" />
                    <Step title="Transformation" />
                    <Step title="Confirmation" />
                  </Steps>
                  <WorkbenchJobForm
                    step={formStep}
                    projectIdGeted={this.state.projectId}
                    jobMode={this.state.jobMode}
                    sparkConfigCheck={this.state.sparkConfigCheck}
                    onShowSparkConfigModal={this.onShowSparkConfigModal}
                    fieldSelected={this.state.fieldSelected}
                    initResultFieldClass={this.initResultFieldClass}
                    onShowJobSinkConfigModal={this.onShowJobSinkConfigModal}
                    onInitJobNameValue={this.onInitJobNameValue}
                    onInitJobSourceNs={this.onInitJobSourceNs}
                    onInitJobSinkNs={this.onInitJobSinkNs}
                    sourceTypeNamespaceData={this.state.jobSourceNsData}
                    sinkTypeNamespaceData={this.state.jobSinkNsData}
                    jobResultFieldsValue={this.state.jobResultFieldsValue}
                    initStartTS={this.initStartTS}
                    initEndTS={this.initEndTS}

                    jobStepSourceNs={this.state.jobStepSourceNs}
                    jobStepSinkNs={this.state.jobStepSinkNs}

                    onShowJobTransModal={this.onShowJobTransModal}
                    jobTransTableSource={jobFormTranTableSource}
                    jobTranTagClassName={this.state.jobTranTagClassName}
                    jobTranTableClassName={this.state.jobTranTableClassName}

                    onEditTransform={this.onJobEditTransform}
                    onAddTransform={this.onJobAddTransform}
                    onDeleteSingleTransform={this.onJobDeleteSingleTransform}
                    onUpTransform={this.onJobUpTransform}
                    onDownTransform={this.onJobDownTransform}
                    jobTranTableConfirmValue={this.state.jobTranTableConfirmValue}

                    ref={(f) => { this.workbenchJobForm = f }}
                  />
                  <Modal
                    title="Configs"
                    okText="保存"
                    wrapClassName="ant-modal-large"
                    visible={this.state.sparkConfigModalVisible}
                    onOk={this.onSparkConfigModalOk}
                    onCancel={this.hideSparkConfigModal}>
                    <StreamConfigForm
                      tabPanelKey={this.state.tabPanelKey}
                      ref={(f) => { this.streamConfigForm = f }}
                    />
                  </Modal>
                  {/* Job Sink Config Modal */}
                  <Modal
                    title="Sink Config"
                    okText="保存"
                    wrapClassName="ant-modal-large"
                    visible={this.state.jobSinkConfigModalVisible}
                    onOk={this.onJobSinkConfigModalOk}
                    onCancel={this.hideJobSinkConfigModal}>
                    <div>
                      <h4 className="sink-config-modal-class">{this.state.jobSinkConfigMsg}</h4>
                      <textarea
                        ref={(f) => { this.jobSinkConfigInput = f }}
                        placeholder="Paste your Sink Config JSON here."
                        className="ant-input ant-input-extra"
                        rows="5">
                      </textarea>
                    </div>
                  </Modal>
                  {/* Job Transform Modal */}
                  <Modal
                    title="Transformation"
                    okText="保存"
                    wrapClassName="transform-form-style"
                    visible={this.state.jobTransModalVisible}
                    onOk={this.onJobTransModalOk}
                    onCancel={this.hideJobTransModal}>
                    <FlowTransformForm
                      ref={(f) => { this.flowTransformForm = f }}
                      projectIdGeted={this.state.projectId}
                      tabPanelKey={this.state.tabPanelKey}
                      onInitTransformValue={this.onInitJobTransValue}
                      transformValue={this.state.jobTransValue}
                      step2SinkNamespace={this.state.jobStepSinkNs}
                      step2SourceNamespace={this.state.jobStepSourceNs}
                    />
                  </Modal>
                  {stepButtons}
                </div>
              </div>
            </div>
          </TabPane>
          {/* Namespace Panel */}
          <TabPane tab="Namespace" key="namespace" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}} >
              <Namespace
                projectIdGeted={this.state.projectId}
                namespaceClassHide={this.state.namespaceClassHide}
              />
            </div>
          </TabPane>
          {/* User Panel */}
          <TabPane tab="User" key="user" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <User
                projectIdGeted={this.state.projectId}
                userClassHide={this.state.userClassHide}
              />
            </div>
          </TabPane>
          {/* Udf Panel */}
          <TabPane tab="UDF" key="udf" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <Udf
                projectIdGeted={this.state.projectId}
                udfClassHide={this.state.udfClassHide}
              />
            </div>
          </TabPane>
          {/* Resource Panel */}
          <TabPane tab="Resource" key="resource" style={{height: `${paneHeight}px`}}>
            <div className="ri-workbench" style={{height: `${paneHeight}px`}}>
              <Resource
                projectIdGeted={this.state.projectId}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>
    )
  }
}

Workbench.propTypes = {
  streams: React.PropTypes.oneOfType([
    React.PropTypes.array,
    React.PropTypes.bool
  ]),
  streamSubmitLoading: React.PropTypes.bool,
  streamNameExited: React.PropTypes.bool,
  flowSubmitLoading: React.PropTypes.bool,
  sourceToSinkExited: React.PropTypes.bool,
  projectNamespaces: React.PropTypes.oneOfType([
    React.PropTypes.array,
    React.PropTypes.bool
  ]),
  router: React.PropTypes.any,
  onAddStream: React.PropTypes.func,
  onEditStream: React.PropTypes.func,
  onAddFlow: React.PropTypes.func,
  onEditFlow: React.PropTypes.func,
  onQueryFlow: React.PropTypes.func,
  onLoadkafka: React.PropTypes.func,
  onLoadStreamConfigJvm: React.PropTypes.func,
  onLoadStreamNameValue: React.PropTypes.func,
  onLoadStreamDetail: React.PropTypes.func,
  onLoadSelectStreamKafkaTopic: React.PropTypes.func,
  onLoadSourceSinkTypeNamespace: React.PropTypes.func,
  onLoadSinkTypeNamespace: React.PropTypes.func,
  onLoadTranSinkTypeNamespace: React.PropTypes.func,
  onLoadSourceToSinkExist: React.PropTypes.func,
  onLoadJobSourceToSinkExist: React.PropTypes.func,

  onLoadAdminSingleFlow: React.PropTypes.func,
  onLoadUserAllFlows: React.PropTypes.func,
  onLoadAdminSingleStream: React.PropTypes.func,
  onLoadUserStreams: React.PropTypes.func,
  onLoadUserNamespaces: React.PropTypes.func,
  onLoadSelectNamespaces: React.PropTypes.func,
  onLoadUserUsers: React.PropTypes.func,
  onLoadSelectUsers: React.PropTypes.func,
  onLoadResources: React.PropTypes.func,
  onLoadSingleUdf: React.PropTypes.func,
  onAddJob: React.PropTypes.func,
  onQueryJob: React.PropTypes.func,
  onEditJob: React.PropTypes.func,

  onLoadJobName: React.PropTypes.func,
  onLoadJobSourceNs: React.PropTypes.func,
  onLoadJobSinkNs: React.PropTypes.func,
  jobNameExited: React.PropTypes.bool,
  jobSubmitLoading: React.PropTypes.bool
}

export function mapDispatchToProps (dispatch) {
  return {
    onLoadUserAllFlows: (projectId, resolve) => dispatch(loadUserAllFlows(projectId, resolve)),
    onLoadAdminSingleFlow: (projectId, resolve) => dispatch(loadAdminSingleFlow(projectId, resolve)),
    onLoadUserStreams: (projectId, resolve) => dispatch(loadUserStreams(projectId, resolve)),
    onLoadAdminSingleStream: (projectId, resolve) => dispatch(loadAdminSingleStream(projectId, resolve)),
    onLoadUserNamespaces: (projectId, resolve) => dispatch(loadUserNamespaces(projectId, resolve)),
    onLoadSelectNamespaces: (projectId, resolve) => dispatch(loadSelectNamespaces(projectId, resolve)),
    onLoadUserUsers: (projectId, resolve) => dispatch(loadUserUsers(projectId, resolve)),
    onLoadSelectUsers: (projectId, resolve) => dispatch(loadSelectUsers(projectId, resolve)),
    onLoadResources: (projectId, roleType) => dispatch(loadResources(projectId, roleType)),
    onLoadSingleUdf: (projectId, roleType, resolve) => dispatch(loadSingleUdf(projectId, roleType, resolve)),
    onAddStream: (projectId, stream, resolve) => dispatch(addStream(projectId, stream, resolve)),
    onEditStream: (stream, resolve) => dispatch(editStream(stream, resolve)),
    onAddFlow: (values, resolve, final) => dispatch(addFlow(values, resolve, final)),
    onEditFlow: (values, resolve, final) => dispatch(editFlow(values, resolve, final)),
    onQueryFlow: (values, resolve) => dispatch(queryFlow(values, resolve)),
    onLoadkafka: (projectId, nsSys, resolve) => dispatch(loadKafka(projectId, nsSys, resolve)),
    onLoadStreamConfigJvm: (resolve) => dispatch(loadStreamConfigJvm(resolve)),
    onLoadStreamNameValue: (projectId, value, resolve, reject) => dispatch(loadStreamNameValue(projectId, value, resolve, reject)),
    onLoadStreamDetail: (projectId, streamId, roleType, resolve) => dispatch(loadStreamDetail(projectId, streamId, roleType, resolve)),
    onLoadSelectStreamKafkaTopic: (projectId, value, resolve) => dispatch(loadSelectStreamKafkaTopic(projectId, value, resolve)),

    onLoadSourceSinkTypeNamespace: (projectId, streamId, value, type, resolve) => dispatch(loadSourceSinkTypeNamespace(projectId, streamId, value, type, resolve)),
    onLoadSinkTypeNamespace: (projectId, streamId, value, type, resolve) => dispatch(loadSinkTypeNamespace(projectId, streamId, value, type, resolve)),
    onLoadTranSinkTypeNamespace: (projectId, streamId, value, type, resolve) => dispatch(loadTranSinkTypeNamespace(projectId, streamId, value, type, resolve)),
    onLoadSourceToSinkExist: (projectId, sourceNs, sinkNs, resolve, reject) => dispatch(loadSourceToSinkExist(projectId, sourceNs, sinkNs, resolve, reject)),
    onLoadJobSourceToSinkExist: (projectId, sourceNs, sinkNs, resolve, reject) => dispatch(loadJobSourceToSinkExist(projectId, sourceNs, sinkNs, resolve, reject)),
    onLoadJobName: (projectId, value, resolve, reject) => dispatch(loadJobName(projectId, value, resolve, reject)),
    onLoadJobSourceNs: (projectId, value, type, resolve, reject) => dispatch(loadJobSourceNs(projectId, value, type, resolve, reject)),
    onLoadJobSinkNs: (projectId, value, type, resolve, reject) => dispatch(loadJobSinkNs(projectId, value, type, resolve, reject)),
    onAddJob: (values, resolve, final) => dispatch(addJob(values, resolve, final)),
    onQueryJob: (values, resolve, final) => dispatch(queryJob(values, resolve, final)),
    onEditJob: (values, resolve, final) => dispatch(editJob(values, resolve, final))
  }
}

const mapStateToProps = createStructuredSelector({
  streams: selectStreams(),
  streamSubmitLoading: selectStreamSubmitLoading(),
  streamNameExited: selectStreamNameExited(),
  flows: selectFlows(),
  flowSubmitLoading: selectFlowSubmitLoading(),
  sourceToSinkExited: selectSourceToSinkExited(),
  namespaces: selectNamespaces(),
  users: selectUsers(),
  resources: selectResources(),
  projectNamespaces: selectProjectNamespaces(),
  jobNameExited: selectJobNameExited(),
  jobSourceToSinkExited: selectJobSourceToSinkExited()
})

export default connect(mapStateToProps, mapDispatchToProps)(Workbench)
