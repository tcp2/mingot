import { useEffect, useState } from "react";
import styles from "styles/app.module.scss";
import { ipcRenderer as ip } from "electron";

import {
  Space,
  Table,
  Tag,
  Button,
  Form,
  Switch,
  Modal,
  Input,
  Select,
  Drawer,
  Tooltip,
  Row,
  Col,
  Layout,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProfileType } from "electron/type";

const {Option} = Select
// @ts-nocheck
const ProxyForm = ({ item, onSubmitProxy }: {item: any, onSubmitProxy: Function}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({
      proxy_type: item?.proxy?.type,
      proxy_ip: item?.proxy?.ip,
    });
  }, [item]);

  const checkProxy = async () => {
    let formData = form.getFieldsValue();
    console.log(formData);
    let res = await ip.invoke("check-proxy", formData);

    console.log(res);
  };

  const handleSubmit = async (formdata: any) => {
    setLoading(true);
    let proxy = formdata;
    await ip
      .invoke("browser-proxy", { id: item.id, proxy })
      .then((res) => {
        onSubmitProxy(proxy, item);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Form onFinish={handleSubmit} form={form}>
      <h1>Proxy [{item.name}]</h1>
      <Form.Item name="type">
        <Select className="select-after">
          <Option value="">No</Option>
          <Option value="http">HTTP</Option>
          <Option value="socks5">SOCK5</Option>
          <Option value="socks4">SOCK4</Option>
        </Select>
      </Form.Item>
      <Form.Item name="ip">
        <Input
          suffix={
            <Tooltip title="host:port|username|password">
              <InfoCircleOutlined />
            </Tooltip>
          }
        />
      </Form.Item>
      <Form.Item>
        <Row justify="end">
          <Col>
            <Space>
              <Button onClick={checkProxy}>Check</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit
              </Button>
            </Space>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};

export default ProxyForm
