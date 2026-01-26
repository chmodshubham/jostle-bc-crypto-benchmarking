package com.benchmark;

import java.security.Provider;
import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.openssl.jostle.jcajce.provider.JostleProvider;
import org.openjdk.jmh.annotations.*;

@State(Scope.Benchmark)
public abstract class CryptoBenchmark {

    @Param({"BC", "Jostle"})
    public String providerName;

    public Provider provider;

    public void initProvider() {
        if ("BC".equalsIgnoreCase(providerName)) {
            provider = new BouncyCastleProvider();
        } else if ("Jostle".equalsIgnoreCase(providerName)) {
            provider = new JostleProvider();
        } else {
            throw new IllegalArgumentException("Unknown provider: " + providerName);
        }
        Security.addProvider(provider);
    }

    public Provider getProvider() {
        return provider;
    }
}
