import { messageDone } from "@/message";
import { Form, Input, Button, Row, Col, Card } from "antd";
import { ipcRenderer as ip } from "electron";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserLoginType {
  username?: string;
  active?: boolean;
}

const Login = ({ setLoading }: { setLoading: any }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [userLogin, setUserLogin] = useState<UserLoginType>();

  const getAuth = async () => {
    let u = await ip.invoke("auth-get");
    setUserLogin(u);
    return Promise.resolve(u);
  };

  const changeAccount = async () => {
    console.log("change account");
    setLoading(true);
    await ip.invoke("auth-change");
    await getAuth();

    setLoading(false);
  };

  const accountStatus = () => {
    if (!userLogin?.username) return "";

    if (userLogin?.active)
      return (
        <div style={{ color: "#5b8c00", fontSize: "20px" }}>Đã kích hoạt</div>
      );

    return (
      <div style={{ color: "#ff4d4f", fontSize: "20px" }}>Chưa kích hoạt</div>
    );
  };

  const note = () => {
    if (!userLogin?.username || userLogin.active) return "";

    return (
      <div style={{ fontSize: 17 }}>
        <div>Tài khoản của bạn chưa được kích hoạt cho thiết bị này</div>
        <div>Hãy liên hệ admin để được kích hoạt</div>
      </div>
    );
  };

  useEffect(() => {
    getAuth().then((u) => {
      form.setFieldValue("username", u?.username);
    });
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    let { username } = values;
    let active = await ip.invoke("login", username.trim());
    setUserLogin({ ...userLogin, active });

    await getAuth();

    setLoading(false);
    if (active) {
        navigate("/");
        messageDone('Đã kích hoạt tài khoản')
    }
  };

  return (
    <>
      <Row justify="center" align="middle">
        <Col>
          <Card>
            <Form
            style={{ fontSize: "16px" }}
            form={form}
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[
                { required: true, message: "Nhập tên đăng nhập!" },
                { type: "string", min: 3 },
              ]}
            >
              <Input disabled={userLogin?.username != null} />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Row justify="space-between">
                <Col>{accountStatus()}</Col>
                <Col>
                  {userLogin ? (
                    <Button
                      type="primary"
                      size="large"
                      htmlType="button"
                      onClick={changeAccount}
                    >
                      Đổi tài khoản
                    </Button>
                  ) : (
                    <Button size="large" type="primary" htmlType="submit">
                      Yêu cầu kích hoạt
                    </Button>
                  )}
                </Col>
              </Row>
            </Form.Item>
          </Form>
          </Card>
        </Col>
      </Row>
      <Row style={{'marginTop': 10}} justify="center" align="middle">
        <Col>
        {note()}
        </Col>
      </Row>

    </>
  );
};

export default Login;
