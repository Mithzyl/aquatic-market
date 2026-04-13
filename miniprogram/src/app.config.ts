export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/order/index',
    'pages/product-detail/index',
    'pages/booking/index',
    'pages/orders/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fbf6ef',
    navigationBarTitleText: '柳州鲜选',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f7f2ea'
  },
  tabBar: {
    color: '#8b755d',
    selectedColor: '#1f4034',
    backgroundColor: '#fbf6ef',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/order/index',
        text: '下单',
        iconPath: 'assets/icons/order.png',
        selectedIconPath: 'assets/icons/order-active.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: 'assets/icons/receipt.png',
        selectedIconPath: 'assets/icons/receipt-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/user.png',
        selectedIconPath: 'assets/icons/user-active.png'
      }
    ]
  }
})