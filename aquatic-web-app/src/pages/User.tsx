import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';

const User: React.FC = () => {
  const { user, loading, fetchUser, login, logout } = useUserStore();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(phone, name);
  };

  const handleLogout = () => {
    logout();
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'normal':
        return '普通会员';
      case 'vip':
        return 'VIP会员';
      case 'premium':
        return '高级会员';
      default:
        return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'normal':
        return 'text-gray-500';
      case 'vip':
        return 'text-yellow-500';
      case 'premium':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">个人中心</h1>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : user ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className={`text-sm ${getLevelColor(user.level)}`}>
                {getLevelText(user.level)}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">手机号</span>
              <span>{user.phone}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">积分</span>
              <span className="font-medium">{user.points}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">会员等级</span>
              <span className={getLevelColor(user.level)}>{getLevelText(user.level)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">12</div>
              <div className="text-gray-600">待付款</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">8</div>
              <div className="text-gray-600">待收货</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">24</div>
              <div className="text-gray-600">已完成</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">5</div>
              <div className="text-gray-600">退款/售后</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            退出登录
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">登录/注册</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-accent transition"
            >
              登录/注册
            </button>
            <p className="text-center text-gray-600 mt-4">
              登录即表示您同意我们的
              <a href="#" className="text-primary hover:underline">服务条款</a>
              和
              <a href="#" className="text-primary hover:underline">隐私政策</a>
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default User;
