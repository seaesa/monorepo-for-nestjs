import type { Dictionary } from '../../types';
import type { en } from '../en';

export const vi: Dictionary<typeof en> = {
  common: {
    actions: {
      delete: 'Xoá',
      create: 'Tạo',
    },
    settings: {
      title: 'Cài đặt',
      language: 'Ngôn ngữ',
      theme: 'Giao diện',
      themes: { system: 'Theo hệ thống', light: 'Sáng', dark: 'Tối' },
    },
    languages: { en: 'English', vi: 'Tiếng Việt' },
  },
  errors: {
    VALIDATION_FAILED: 'Một số trường không hợp lệ.',
    BAD_REQUEST: 'Yêu cầu không hợp lệ.',
    UNAUTHORIZED: 'Vui lòng đăng nhập để tiếp tục.',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu.',
    CONFLICT: 'Dữ liệu đã tồn tại.',
    RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
    INTERNAL_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.',
    NETWORK_ERROR: 'Không kết nối được máy chủ. Hãy kiểm tra mạng.',
    AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
    AUTH_EMAIL_TAKEN: 'Email này đã được đăng ký.',
    AUTH_EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi đăng nhập.',
    AUTH_TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn.',
    AUTH_TOKEN_INVALID: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
    AUTH_RESET_TOKEN_INVALID: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
    AUTH_VERIFICATION_TOKEN_INVALID: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.',
    AUTH_SESSION_NOT_FOUND: 'Phiên này không còn tồn tại.',
    TASK_NOT_FOUND: 'Công việc này không còn tồn tại.',
  },
  validation: {
    required: 'Trường này là bắt buộc.',
    password_letter: 'Phải chứa ít nhất một chữ cái.',
    password_digit: 'Phải chứa ít nhất một chữ số.',
    invalid: 'Giá trị không hợp lệ.',
    invalid_type: 'Giá trị không hợp lệ.',
    invalid_value: 'Hãy chọn một giá trị được phép.',
    invalid_format: 'Định dạng không hợp lệ.',
    invalid_format_email: 'Hãy nhập email hợp lệ.',
    invalid_format_url: 'Hãy nhập URL hợp lệ.',
    too_small_string: 'Tối thiểu {{minimum}} ký tự.',
    too_small_number: 'Tối thiểu là {{minimum}}.',
    too_small_array: 'Chọn ít nhất {{minimum}}.',
    too_big_string: 'Tối đa {{maximum}} ký tự.',
    too_big_number: 'Tối đa là {{maximum}}.',
    too_big_array: 'Chọn tối đa {{maximum}}.',
  },
  email: {
    welcome: {
      title: 'Chào mừng, {{name}}!',
      body: 'Tài khoản của bạn đã sẵn sàng.',
    },
    verifyEmail: {
      subject: 'Xác nhận địa chỉ email',
      body: 'Mở liên kết sau để xác nhận email: {{link}}',
    },
    passwordReset: {
      subject: 'Đặt lại mật khẩu',
      body: 'Mở liên kết sau để chọn mật khẩu mới: {{link}}. Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    },
  },
  auth: {
    fields: {
      email: 'Email',
      password: 'Mật khẩu',
      name: 'Họ tên',
    },
    login: {
      title: 'Đăng nhập',
      submit: 'Đăng nhập',
      noAccount: 'Chưa có tài khoản?',
    },
    register: {
      title: 'Tạo tài khoản',
      submit: 'Tạo tài khoản',
      hasAccount: 'Đã có tài khoản?',
    },
    forgot: {
      link: 'Quên mật khẩu?',
      title: 'Đặt lại mật khẩu',
      submit: 'Gửi liên kết đặt lại',
      sent: 'Nếu địa chỉ này có tài khoản, liên kết đặt lại đang được gửi tới.',
    },
    reset: {
      title: 'Chọn mật khẩu mới',
      submit: 'Lưu mật khẩu',
      done: 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.',
    },
    verify: {
      title: 'Xác minh email',
      pending: 'Đang xác minh email…',
      done: 'Email của bạn đã được xác minh.',
    },
    logout: 'Đăng xuất',
  },
  tasks: {
    title: 'Công việc',
    empty: 'Chưa có công việc nào. Hãy tạo việc đầu tiên.',
    new: 'Công việc mới',
    fields: {
      title: 'Tiêu đề',
      description: 'Mô tả',
      status: 'Trạng thái',
      dueAt: 'Hạn',
      location: 'Vị trí',
    },
    statuses: { TODO: 'Cần làm', IN_PROGRESS: 'Đang làm', DONE: 'Hoàn thành' },
    filters: { all: 'Tất cả' },
    location: {
      attach: 'Gắn vị trí hiện tại',
      remove: 'Bỏ vị trí',
      denied: 'Quyền truy cập vị trí đã bị từ chối.',
    },
    deleted: 'Đã xoá công việc.',
  },
  push: {
    taskDue: {
      title: 'Đến hạn công việc',
      body: '{{title}} đã đến hạn.',
    },
  },
};
