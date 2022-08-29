import { useEffect, useState } from "react";
import { ipcRenderer as ip } from "electron";
const ProxyAgent = require("simple-proxy-agent");
import {
  Space,
  Button,
  Form,
  Input,
  Select,
  Tooltip,
  Row,
  Col,
  Typography,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProfileType } from "electron/type";
import { messageError } from "@/message";
import { Rule } from "antd/lib/form";
const https = require("https");

const { Option } = Select;
// @ts-nocheck
const ProxyForm = ({
  item,
  onSubmitProxy,
}: {
  item: any;
  onSubmitProxy: Function;
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [ruleInfo, setRuleInfo] = useState<Rule[]>();
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    form.resetFields();

    let info = "";
    if (item?.proxy) {
      let { host, mode, port, username, password } = item.proxy;
      info = [host, port, username, password].filter((e) => e).join(":");

      form.setFieldsValue({ mode, info });
    }
  }, [item]);

  const checkProxy = async () => {
    let { mode, info } = form.getFieldsValue();

    if(!info?.trim() || !mode) {
      messageError('Bạn quên điền thông tin proxy rồi kìa')
      return
    }
    let infos = info.split(":");
    infos = infos.map((e: string) => e.trim())
    let [host, port, username, password] = infos

    if(!host || !port) {
      messageError('Bạn nhập proxy sai định dang rồi')
      return
    }

    let proxy = mode + "://";
    if (username) {
      const resultPassword = password ? ":" + password + "@" : "@";
      proxy += username + resultPassword;
    }
    proxy += host + ":" + port;

    const agent = new ProxyAgent(proxy, { tunnel: true, timeout: 10000 });

    console.log("request " + proxy);
    try {
      const data = await new Promise((resolve, reject) => {
        https
          .get("http://www.geoplugin.net/json.gp", { agent }, (res: any) => {
            let resultResponse = "";
            res.on("data", (data: any) => (resultResponse += data));

            res.on("end", () => {
              let parsedData;
              try {
                parsedData = JSON.parse(resultResponse);
              } catch (e) {
                reject(e);
              }

              resolve({
                ...res,
                body: parsedData,
              });
            });
          })
          .on("error", (err: any) => reject(err));
      });
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(JSON.stringify(err));
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);

    const { mode, info } = data;
    let [host, port, username, password] = info.split(":");
    let proxy = {
      mode,
      host,
      port,
      username,
      password,
    };
    try {
      await ip.invoke("browser-proxy", { id: item.id, proxy });
      onSubmitProxy(proxy, item);
      console.log("proxy saved");
    } catch (e) {
      messageError();
    }

    setLoading(false);
  };

  return (
    <div>
      <Form onFinish={handleSubmit} form={form}>
        <h1>Proxy [{item.name}]</h1>
        <Form.Item name="mode">
          <Select
            className="select-after"
            onChange={() => {
              if (form.getFieldValue("mode")) {
                setRuleInfo([{ required: true }]);
              } else {
                setRuleInfo([]);
              }
            }}
          >
            <Option value="">-</Option>
            <Option value="http">HTTP</Option>
            <Option value="socks5">SOCK5</Option>
            <Option value="socks4">SOCK4</Option>
          </Select>
        </Form.Item>
        <Form.Item name="info" rules={ruleInfo}>
          <Input
            onChange={() => {}}
            placeholder="[host]:[port]:[username]:[password]"
            suffix={
              <Tooltip title="ví dụ: 192.168.0.1:22:admin:password">
                <InfoCircleOutlined />
              </Tooltip>
            }
          />
        </Form.Item>
        <Form.Item>
          <Row justify="space-between">
            <Col>
              <Button onClick={checkProxy}>Check</Button>
            </Col>

            <Col>
              <Button
                block
                size="large"
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Lưu
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
      <Typography>{result}</Typography>
    </div>
  );
};

export default ProxyForm;
