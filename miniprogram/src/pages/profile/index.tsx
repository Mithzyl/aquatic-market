import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const mockUser = {
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
  name: '柳州鲜选会员'
}

export default function Profile() {
  const handleCall = () => {
    Taro.makePhoneCall({ phoneNumber: '400-820-5520' })
  }

  return (
    <View className='profile-page'>
      {/* 用户头像 */}
      <View className='user-section'>
        <View className='avatar-wrapper'>
          <Image className='avatar' src={mockUser.avatar} mode='aspectFill' />
        </View>
        <Text className='user-name'>{mockUser.name}</Text>
      </View>

      {/* 联系信息 */}
      <View className='contact-card'>
        <View className='contact-icon'>
          <Text>📞</Text>
        </View>
        <View className='contact-info'>
          <Text className='contact-label'>联系手机</Text>
          <Text className='contact-phone'>400-820-5520</Text>
        </View>
        <View className='call-btn' onClick={handleCall}>
          <Text>📞</Text>
        </View>
      </View>

      {/* 提示 */}
      <View className='tips'>
        <Text className='tips-text'>小程序版本 - 用户端移植</Text>
        <Text className='tips-text'>后续迭代将对接微信登录</Text>
      </View>
    </View>
  )
}