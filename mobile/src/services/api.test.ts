import axios from 'axios';

jest.mock('axios');

describe('API Service', () => {
  it('should make a GET request', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' } };
    (axios.get as jest.Mock).mockResolvedValue(mockResponse);

    const response = await axios.get('/test');
    expect(response.data).toEqual(mockResponse.data);
  });

  it('should handle errors', async () => {
    const error = new Error('Network Error');
    (axios.get as jest.Mock).mockRejectedValue(error);

    await expect(axios.get('/test')).rejects.toThrow('Network Error');
  });
});
