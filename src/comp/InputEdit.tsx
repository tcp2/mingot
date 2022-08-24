import { useEffect, useState } from "react";
import styles from "styles/app.module.scss";
import { ipcRenderer as ip } from "electron";

import {
  Space,
  Form,
  Input,
} from "antd";

import { ProfileType } from "electron/type";
import { CloseCircleOutlined, EditOutlined } from "@ant-design/icons";

const InputEdit = ({item, handleEditName}: {item: ProfileType, handleEditName: Function}) => {
  const [showInput, setShowInput] = useState(false)
  const [form] = Form.useForm();
  const [labelInput, setLabelInput] = useState<string>()

  useEffect(() => {
    setBrowserName(item.name)
  },[])


  const setBrowserName = (s: string) => {
    form.setFieldValue('name_browser', s)
    setLabelInput(s)
  }

  const openInput =() => {
    setShowInput(true)
  }

  const onPressEnter = async () => {
    let val: string = form.getFieldValue('name_browser').trim()

    if(val.trim() == labelInput?.trim()) {
      form.setFieldValue('name_browser', val.trim())
      setShowInput(false)
      return
    }

    let res = await ip.invoke('browser-name', {id: item.id, name: val})
    if(res) {
      setBrowserName(val)
      await handleEditName(res)
    }

    setShowInput(false)
  }

  return (
    <div style={{'minWidth': '220px'}}>
      <Form form={form} >
        <Space hidden={showInput} className="txt-edit">
          <div>{labelInput}</div>
          <EditOutlined onClick={openInput}/>
        </Space>
        <Space hidden={!showInput}  >
            <Form.Item style={{'marginBottom': '0'}} name="name_browser">
              <Input onPressEnter={onPressEnter}/>
            </Form.Item>
            <CloseCircleOutlined style={{'cursor': 'pointer'}} onClick={() => setShowInput(false)} />
        </Space>
      </Form>
    </div>
  )
}

export default InputEdit
