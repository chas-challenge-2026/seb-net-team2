# This will install cmake AND cmocka

wget https://github.com/Kitware/CMake/releases/download/v4.4.3/cmake-4.4.3-linux-x86_64.sh

chmod +x cmake-4.4.3-linux-x86_64.sh
sudo ./cmake-4.4.3-linux-x86_64.sh --prefix=/usr/local --exclude-subdir --skip-license

wget https://cmocka.org/files/2.0/cmocka-2.0.2.tar.xz
tar -xvf cmocka-2.0.2.tar.xz

cd cmocka-2.0.2

cmake -S . -B build
cmake --build build
cmake --build build --target test
sudo cmake --install build

cd ..

rm cmake-4.4.3-linux-x86_64.sh
rm -rf cmocka-2.0.2
rm cmocka-2.0.2.tar.xz

echo /usr/local/lib | sudo tee /etc/ld.so.conf.d/usr-local.conf
sudo ldconfig