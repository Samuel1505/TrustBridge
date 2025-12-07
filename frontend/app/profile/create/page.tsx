'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, X, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    mission: '',
    description: '',
    email: '',
    website: '',
  });
  const [logo, setLogo] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Simulate profile creation
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create NGO Profile</h1>
                <p className="text-gray-600 mt-1">Complete your organization details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-full hover:border-emerald-600 hover:text-emerald-600 transition-all flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <appkit-button />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showPreview ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your NGO name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mission Statement * (300 characters max)
                    </label>
                    <textarea
                      value={formData.mission}
                      onChange={(e) => handleInputChange('mission', e.target.value)}
                      placeholder="Brief mission statement"
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.mission.length}/300 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Full Description * (2000 characters max)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Detailed description of your organization's work and impact"
                      rows={8}
                      maxLength={2000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@yourorganization.org"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourorganization.org"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Media Upload */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Media</h2>
                
                {/* Logo Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Organization Logo (Optional)
                  </label>
                  {logo ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-200">
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setLogo(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl hover:border-emerald-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload</span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Images Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Photos/Videos (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                        <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 6 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-xs">Add</span>
                        </div>
                      </label>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload up to 6 images showcasing your work
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Preview Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Preview</h3>
                <div className="space-y-4">
                  {logo && (
                    <img src={logo} alt="Logo preview" className="w-20 h-20 rounded-xl object-cover" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">
                      {formData.name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mission</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {formData.mission || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-700">
                      {formData.email || 'Not set'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.mission || !formData.description || !formData.email}
                  className="w-full mt-6 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Preview</h2>
            <div className="space-y-6">
              {logo && (
                <img src={logo} alt="Logo" className="w-24 h-24 rounded-2xl object-cover" />
              )}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{formData.name}</h3>
                <p className="text-xl text-gray-700">{formData.mission}</p>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="aspect-video rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900 mb-2">About</h4>
                <p className="text-gray-700 whitespace-pre-line">{formData.description}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Contact</h4>
                <p className="text-gray-700">{formData.email}</p>
                {formData.website && <p className="text-gray-700">{formData.website}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}