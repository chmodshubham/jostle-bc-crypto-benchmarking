# Crypto Performance Benchmarks

JMH benchmarking suite comparing cryptographic performance between **[Bouncy Castle (BC)](https://github.com/bcgit/bc-java)** and **[OpenSSL Jostle](https://github.com/openssl-projects/openssl-jostle)** providers.

## Prerequisites

### Install OpenJDK Java 25+

Download the OpenJDK Java 25 [download page](https://jdk.java.net/25/).

```bash
wget https://download.java.net/java/GA/jdk25.0.1/2fbf10d8c78e40bd87641c434705079d/8/GPL/openjdk-25.0.1_linux-x64_bin.tar.gz

# Create directory for Java installation
sudo mkdir -p /opt/java

# Extract the tar.gz file to /opt/java
sudo tar -xzf openjdk-25.0.1_linux-x64_bin.tar.gz -C /opt/java

# Rename for easier access (optional)
sudo mv /opt/java/jdk-25.0.1 /opt/java/jdk-25
```

**Set Environment Variables**

Configure `JAVA_HOME` and `PATH` variables for your system:

```bash
# Edit your bash profile
vim ~/.bashrc

# Add these lines at the end of the file:
export JAVA_HOME=/opt/java/jdk-25
export PATH=$PATH:$JAVA_HOME/bin

# Apply the changes
source ~/.bashrc
```

## Supported Algorithms

- **Symmetric**: AES, ARIA, Camellia, SM4 (AEAD, Block, Stream modes)
- **KDF**: PBKDF2 (SHA2, SHA3, SM3) and Scrypt
- **Post-Quantum**: ML-DSA, ML-KEM, SLH-DSA (NIST variants)

## Setup

### 1. Dependencies

Place the following provider JARs in the `libs/` directory:

- `bcprov-jdk18on-*.jar` (from Bouncy Castle)
- `openssl-jostle-*.jar` (from Jostle provider)

> [!NOTE]
> Follow [ngkore/jostle](https://github.com/ngkore/jostle) and [ngkore/bouncy-castle-java](https://github.com/ngkore/bouncy-castle-java) for instructions on how to build the Jostle and Bouncy Castle provider.

### 2. Native Library Paths

The Jostle provider requires OpenSSL and its own JNI libraries. Edit `scripts/run_benchmarks.sh` and update the `DEFAULT_NATIVE_LIB_PATH` variable to match your environment:

```bash
# Example in scripts/run_benchmarks.sh
DEFAULT_NATIVE_LIB_PATH="/path/to/openssl/libssl.so:/path/to/jostle/libinterface_jni.so"
```

If you don't know the paths, use the `find` command:

**OpenSSL (look for libssl.so):**

```bash
find /usr -name "libssl.so*" 2>/dev/null
# Or typical local install:
find /home -name "libssl.so*" 2>/dev/null
```

Output:

```bash
ubuntu@vm01:~$ find /home -name "libssl.so*" 2>/dev/null
/home/ubuntu/openssl-3.6.0/libssl.so.3
/home/ubuntu/openssl-3.6.0/libssl.so
/home/ubuntu/openssl_3_6/lib64/libssl.so.3
/home/ubuntu/openssl_3_6/lib64/libssl.so
```

**Jostle (look for libinterface_jni.so):**

```bash
find / -name "libinterface_jni.so" 2>/dev/null
```

Output:

```bash
ubuntu@vm01:~$ find / -name "libinterface_jni.so" 2>/dev/null
/home/ubuntu/bouncy-jostle/openssl-jostle/jostle/src/main/resources/native/linux/x86_64/libinterface_jni.so
/home/ubuntu/bouncy-jostle/openssl-jostle/jostle/bin/main/native/linux/x86_64/libinterface_jni.so
/home/ubuntu/bouncy-jostle/openssl-jostle/jostle/build/resources/main/native/linux/x86_64/libinterface_jni.so
/home/ubuntu/bouncy-jostle/openssl-jostle/interface/libinterface_jni.so
```

Use `/home/ubuntu/openssl_3_6/lib64:/home/ubuntu/bouncy-jostle/openssl-jostle/jostle/build/resources/main/native/linux/x86_64` for the `DEFAULT_NATIVE_LIB_PATH`.

## Running Benchmarks

Use the provided script to execute benchmarks. It handles configuration, native paths, and logging.

```bash
./scripts/run_benchmarks.sh
```

### Outputs

- **JSON Results**: `build/results/jmh/results.json` (for analysis)
- **Execution Log**: `build/results/jmh/benchmark_run.log` (terminal output)

## Configuration

Configuration is centrally managed in `scripts/run_benchmarks.sh`.

### 1. Benchmark Parameters

Open `scripts/run_benchmarks.sh` and modify the following variables at the top of the file:

| Parameter    | Description                                | Default   |
| ------------ | ------------------------------------------ | --------- |
| `WARMUP`     | Number of warmup iterations                | `2`       |
| `ITERATIONS` | Number of measurement iterations           | `3`       |
| `TIME`       | Duration of each iteration                 | `"5s"`    |
| `FORK`       | Number of fresh JVM forks                  | `1`       |
| `MODE`       | JMH Mode (`thrpt`, `avgt`, `sample`, `ss`) | `"thrpt"` |

## Visualizer

A React-based web application for visualizing benchmark results with interactive charts and tables.

### Setup

```bash
cd visualizer
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

The built files will be in `visualizer/dist/`.

### Usage

The visualizer automatically loads results from `results/results.json` via symlink. After running benchmarks, start the visualizer to see the comparison between BC and Jostle performance.
