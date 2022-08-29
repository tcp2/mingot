import { messageDone, messageError } from "@/message";
import { Button, Col, Form, Input, Row } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { ipcRenderer as ip } from "electron";

const FeedBack = ({setLoading}: {setLoading: Function}) => {
  const [form] = Form.useForm();
  const onFinish = async (vals: any) => {
    setLoading(true)

    console.log(vals);
    let status = 0
    try{
       status = await ip.invoke('feedback', vals)
    }catch(err) {
      console.log(err);
    }

    if(status) {
      messageDone('Đã gửi. Cảm ơn bạn đã đóng góp ý kiến 😚')
      setLoading(false)
      form.resetFields()
      return
    }

    setLoading(false)
    messageError('Chưa gửi được, bạn hãy thử lại sau nhé!')
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 14 }}
    >
      <Form.Item
        label="Tiêu đề"
        name="title"
        rules={[{ required: true, min: 5 }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Nội dung"
        name="content"
        rules={[{ required: true, min: 10 }]}
      >
        <TextArea rows={5} />
      </Form.Item>
      <Form.Item
        label="Thông tin liên hệ"
        name="contact"
        rules={[{ required: true }]}
      >
        <Input placeholder="Số điện thoại| email" />
      </Form.Item>
      <Form.Item>
        <Row justify="end">
          <Col>
            <Button style={{'padding': '0 40px'}} size="large" type="primary" htmlType="submit">
              Gửi
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
};

export default FeedBack;
